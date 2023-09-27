export const sendEmail = async (email: string, subject: string, text: string) => {
    const send_request = new Request('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email }],
                },
            ],
            from: {
                email: 'sales@ah.games',
                name: 'AH Games Monroe',
            },
            subject,
            content: [
                {
                    type: 'text/plain',
                    value: text,
                },
            ],
        }),
    })
    const send_response = await fetch(send_request).then((res) => console.log(res));
    return send_response;
}
