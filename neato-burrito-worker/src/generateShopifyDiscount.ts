import { Env } from './types';

export const generateShopifyDiscountRequest = async (env:Env, customerId: string, amount: number, message:string) => {

    const shopifyUrl = env.SHOPIFY_URL;
    const shopifyKey = env.SHOPIFY_KEY;

    const req = new Request(`https://${shopifyUrl}/admin/api/2023-07/price_rules.json`, {
        method: 'POST',
        headers: {
            'X-Shopify-Access-Token': shopifyKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "price_rule": {
                "title": message,
                "target_type": "line_item",
                "target_selection": "all",
                "allocation_method": "across",
                "value_type": "fixed_amount",
                "value": `-${amount}`,
                "customer_selection": "prerequisite",
                "prerequisite_customer_ids": [customerId],
                "usage_limit": 1,
                "starts_at": new Date().toISOString()
            }
        })
    })

    const discount = await fetch(req).then((res) => res.json()) as any;
    console.log(discount);

    const req2 = new Request(`https://${shopifyUrl}/admin/api/2023-07/price_rules/${discount.price_rule.id}/discount_codes.json`, {
        method: 'POST',
        headers: {
            'X-Shopify-Access-Token': shopifyKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "discount_code": {
                "code": `M64-STAR-${Math.floor(Math.random() * 1000000)}`,
            }
        })
    })
    const discountCode = await fetch(req2).then((res) => res.json()) as any;
    console.log(discountCode);
    return discountCode.discount_code.code;
}