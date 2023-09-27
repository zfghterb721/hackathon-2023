/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { sendDiscordMessage } from "./sendDiscordMessage";

export interface Env {
	DISCORD_HOOK: string;
	CLIENT_SECRET: string;
	PLAYER_STATE: DurableObjectNamespace;
}

type PlayerRegistration = {
	email: string;
	name: string;
};

export const registerPlayer = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const data = await request.json();
	const systemId = request.headers.get("x-neato-burrito-system-id");
	if (!systemId) {
		return new Response("Missing system id", { status: 400 });
	}
	const { email, name } = data as PlayerRegistration;
	if(!email || !name) {
		return new Response("Missing email or name", { status: 400 });
	}
	let id = env.PLAYER_STATE.idFromName(systemId);
	let playerState = env.PLAYER_STATE.get(id);
	const res = await playerState.fetch(new Request(request, {
		method: "POST",
		headers: {
			"content-type": "application/json;charset=UTF-8",
		},
		body: JSON.stringify({ email, name }),
	}));
	const body = await res.json();
	return new Response(JSON.stringify(body), {
		headers: {
			"content-type": "application/json;charset=UTF-8",
		},
	});
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const incomingSecret = request.headers.get("x-neato-burrito-secret");
		if (incomingSecret !== env.CLIENT_SECRET) {
			return new Response("Unauthorized", { status: 401 });
		}
		const path = new URL(request.url).pathname;
		if (path == "/register-player") {
			return registerPlayer(request, env, ctx);
		}
		const data = await request.json();
		console.log(JSON.stringify(data, null, 3));
		const messages = (data as any).filter((t: any) => t.value).map((d: any) => {
			const message = {
				embeds: [
					{
						title: `${d.gameName} - ${d.course}`,
						description: `${d.name}`,
					},
				],
			} as any;
			if (d.icon) {
				message.embeds[0].thumbnail = {
					url: d.icon,
				}
			}
			return sendDiscordMessage(message, env)
		})
		await Promise.all(messages);
		return new Response('Hello World!');
	},
};
