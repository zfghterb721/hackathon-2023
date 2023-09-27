export interface Env {
	DISCORD_HOOK: string;
	CLIENT_SECRET: string;
	PLAYER_STATE: DurableObjectNamespace;
    SHOPIFY_URL: string;
    SHOPIFY_KEY: string;
}

export type PlayerRegistration = {
	email: string;
	name: string;
};