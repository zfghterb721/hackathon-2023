import { Env } from './index'
export const sendDiscordMessage = async (contents: any, env: Env) => {
    const webhookURL = env.DISCORD_HOOK;
    const data = await fetch(webhookURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(contents)
    });
    console.log(data)
}