/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { generateShopifyDiscountRequest } from "./generateShopifyDiscount";
import { sendDiscordMessage } from "./sendDiscordMessage";
import { sendEmail } from "./sendEmail";
import { Env, PlayerRegistration } from "./types";

const TIME_LIMIT = 1000  * 60 * 10 // 10 minutes

export class PlayerState {
	env: any;
	state: DurableObjectState;
	constructor(state: DurableObjectState, env: any) {
		this.state = state;
		this.env = env;
	};

	async fetch(request: Request) {
		if(request.method === "GET") {
			let currentPlayer = await this.state.storage.get('current-player') as string|undefined;
			if(!currentPlayer) {
				return new Response(JSON.stringify({}), {
					headers: {
						"content-type": "application/json;charset=UTF-8",
					},
				});
			}
			const currentPlayerParsed = JSON.parse(currentPlayer);
			const { email, name, sessionStart } = currentPlayerParsed as PlayerRegistration & { sessionStart: string };
			const sessionActive = new Date().getTime() - new Date(sessionStart).getTime() < TIME_LIMIT;
			const count = await this.state.storage.get(`count-${email}`) as number;
			return new Response(JSON.stringify({
				count: (count || 0),
				sessionActive,
				sessionEnd: new Date(new Date(sessionStart).getTime() + TIME_LIMIT).toISOString(),
				...currentPlayerParsed
			}), {
				headers: {
					"content-type": "application/json;charset=UTF-8",
				},
			});
		}
		const data = await request.json() as any;
		const { email, name } = data as PlayerRegistration;
		await this.state.storage.put('current-player', JSON.stringify({ ...data, sessionStart: new Date().toISOString() }));
		const count = await this.state.storage.get(`count-${email}`) as number;
		if(!count) {
			await this.state.storage.put(`count-${email}`, 0);
		}
		await this.state.storage.put(`count-${email}`, (count || 0) + 1);

		return new Response(JSON.stringify({
			count: (count || 0) + 1,
			...data
		}), {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		});
	}
}

export const registerPlayer = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const data = await request.json();
	const systemId = request.headers.get("x-neato-burrito-system-id");
	if (!systemId) {
		return new Response("Missing system id", { status: 400 });
	}
	const { email, name } = data as PlayerRegistration;
	if(!email) {
		return new Response("Missing email", { status: 400 });
	}
	let id = env.PLAYER_STATE.idFromName(systemId);
	let playerState = env.PLAYER_STATE.get(id);
	const res = await playerState.fetch(new Request(request, {
		method: "POST",
		headers: {
			"content-type": "application/json;charset=UTF-8",
		},
		body: JSON.stringify(data),
	}));
	const body = await res.json();
	return new Response(JSON.stringify(body), {
		headers: {
			"content-type": "application/json;charset=UTF-8", "access-control-allow-origin": "*"
		},
	});
};

export const getCurrentPlayer = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const systemId = request.headers.get("x-neato-burrito-system-id");
	if (!systemId) {
		return new Response("Missing system id", { status: 400 });
	}
	let id = env.PLAYER_STATE.idFromName(systemId);
	let playerState = env.PLAYER_STATE.get(id);
	const res = await playerState.fetch(new Request(request, {
		method: "GET",
	}));
	const body = await res.json();
	return new Response(JSON.stringify(body), {
		headers: {
			"content-type": "application/json;charset=UTF-8", "access-control-allow-origin": "*"
		},
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response("OK", {
				headers: {
					"access-control-allow-origin": "*",
					"access-control-allow-headers": "*",
					"access-control-allow-methods": "GET, POST, PUT, OPTIONS",
				},
			});
		}
		const incomingSecret = request.headers.get("x-neato-burrito-secret");
		const systemId = request.headers.get("x-neato-burrito-system-id");
		if (incomingSecret !== env.CLIENT_SECRET) {
			return new Response("Unauthorized", { status: 401, headers: { "access-control-allow-origin": "*" } });
		}
		//if options, return 200
		const path = new URL(request.url).pathname;
		if (path == "/register-player") {
			return registerPlayer(request, env, ctx);
		}
		if (path == "/current-player") {
			return getCurrentPlayer(request, env, ctx);
		}
		const currentPlayer = await getCurrentPlayer(new Request(request.url,{
			method: "GET",
			headers: {
				"x-neato-burrito-system-id": systemId,
			}
		}), env, ctx).then((r) => r.json()) as any;


		const data = await request.json();
		console.log(JSON.stringify(data, null, 3));
		const messages = (data as any).filter((t: any) => t.value).map(async (d: any) => {
			const message = {
				embeds: [
					{
						title: `${currentPlayer.sessionActive?`${currentPlayer.email} got an item!`:`An anonymous player got an item!`} ${d.gameName} - ${d.course}`,
						description: `${d.name}`,
					},
				],
			} as any;
			if (d.icon) {
				message.embeds[0].thumbnail = {
					url: d.icon,
				}
			}
			if(currentPlayer.sessionActive && currentPlayer.shopifyCustomerId) {
				const discount = await generateShopifyDiscountRequest(env, currentPlayer.shopifyCustomerId, 5, `In Store Video Game Achievement - ${d.gameName} - ${d.course} - ${d.name}`);
				console.log(discount);
				message.embeds[0].description = `${d.name} - Their discount code is ${discount}`;
				//const email = await sendEmail(currentPlayer.email, "You got an achievement!", `You got an achievement! ${d.gameName} - ${d.course} Your discount code is ${discount}`);
			}	
			return sendDiscordMessage(message, env)
		})
		await Promise.all(messages);
		return new Response('Hello World!');
	},
};
