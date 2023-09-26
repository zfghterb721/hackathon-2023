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
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const incomingSecret = request.headers.get("x-neato-burrito-secret");
		if (incomingSecret !== env.CLIENT_SECRET) {
			return new Response("Unauthorized", { status: 401 });
		}
		const data = await request.json();
		console.log(JSON.stringify(data, null, 3));
		const messages = (data as any).filter(t => t.value).map(d => {
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
