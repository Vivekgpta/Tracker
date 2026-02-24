import { DashboardData, Expense, Wallet } from "../types";

export const api = {
  async getData(): Promise<DashboardData> {
    const res = await fetch("/api/data");
    return res.json();
  },

  async addExpense(expense: Omit<Expense, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    return res.json();
  },

  async updateExpense(id: number, expense: Partial<Expense>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expense/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    return res.json();
  },

  async deleteExpense(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expense/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async addWallet(wallet: Omit<Wallet, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wallet),
    });
    return res.json();
  },

  async updateWallet(id: number, wallet: Partial<Wallet>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/wallet/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wallet),
    });
    return res.json();
  },

  async sendAlert(payload: { insight: string; walletName: string; limit: number }): Promise<{ success: boolean }> {
    const res = await fetch("/api/send-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
