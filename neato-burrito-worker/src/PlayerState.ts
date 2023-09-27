export class PlayerState {
	env: any;
	state: DurableObjectState;
	constructor(state: DurableObjectState, env: any) {
		this.state = state;
		this.env = env;
	};

	async fetch(request: Request) {
		const data = await request.json();
		const { email, name } = data as PlayerRegistration;
		const count = await this.state.storage.get(`count-${email}`) as number;
		if(!count) {
			await this.state.storage.put(`count-${email}`, 0);
		}
		await this.state.storage.put(`count-${email}`, (count || 0) + 1);

		return new Response(JSON.stringify({
			count: (count || 0) + 1,
			email,
			name,
		}), {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		});
	}
}