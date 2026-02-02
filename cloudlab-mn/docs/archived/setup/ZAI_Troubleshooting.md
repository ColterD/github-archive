# Z.AI Authorization Troubleshooting

The error `"insufficient balance or resource package"` indicates that while your API Key is valid (you are hitting their servers), the account associated with the key has no **API Credits**.

## Critical Distinction: "Pro" vs "API"

Most AI providers separate these two billing systems:

1.  **Chat Subscription (Web/App)**: e.g., "$20/month for ChatGLM Professional". This **DOES NOT** include API access.
2.  **API Platform (Developer)**: This requires a separate "Resource Package" or "Pay-as-you-go" credit balance.

## Verification Steps

1.  Log in to the **[Zhipu AI Open Platform](https://open.bigmodel.cn/usercenter/balance)** (not the Chat interface).
2.  Check **"Token Balance"** or **"Resource Pack Balance"**.
    - If it is 0, you must purchase a "Resource Package" (API Credits).
    - Note: GLM-4.7 (Thinking) is a premium model and burns tokens somewhat quickly due to the internal thought process.

## Reduced Budget Configuration

I have updated your config to request smaller "Thinking Budgets" (2k-4k tokens instead of 16k-65k).
Sometimes, requesting a massive budget triggers an "Insufficient Balance" rejection because the system estimates it _might_ cost more than you have, even if the actual usage would be lower.

## Testing

Try running the "Flash" model, which is often free or extremely cheap, to prove the connection works:

```bash
opencode run --model zai/glm-4.5-flash "Hello"
```

If this works, your Key is fine, and you simply need to top up credits for the 4.7 model.
