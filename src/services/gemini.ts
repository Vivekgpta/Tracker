import { GoogleGenAI } from "@google/genai";
import { Expense, Wallet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getSpendingInsights(wallet: Wallet, expenses: Expense[]) {
  const recentExpenses = expenses
    .filter(e => e.wallet_id === wallet.id)
    .slice(0, 10)
    .map(e => `${e.date}: ${e.amount} (${e.category}) - ${e.description}`)
    .join("\n");

  const prompt = `
    The user has exceeded their monthly spending limit of ${wallet.monthly_limit} for the wallet "${wallet.name}".
    Current balance: ${wallet.balance}.
    
    Recent expenses:
    ${recentExpenses}
    
    Provide a brief, helpful analysis of their spending patterns and 3 actionable tips to save money. 
    Keep the tone encouraging but firm. Format as markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights due to an error.";
  }
}
