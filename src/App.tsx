import React, { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Stats } from "./components/Stats";
import { api } from "./services/api";
import { DashboardData, Expense, Wallet } from "./types";
import { getSpendingInsights } from "./services/gemini";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Bell, LayoutDashboard, PieChart, Wallet as WalletIcon, X, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "stats">("dashboard");
  const [alert, setAlert] = useState<{ insight: string; walletName: string } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const result = await api.getData();
      setData(result);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (wallet: Omit<Wallet, "id">) => {
    try {
      await api.addWallet(wallet);
      loadData();
    } catch (error) {
      console.error("Failed to add wallet", error);
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, "id">) => {
    try {
      await api.addExpense(expense);
      const updatedData = await api.getData();
      setData(updatedData);

      // Check for limit crossing
      const wallet = updatedData.wallets.find(w => w.id === expense.wallet_id);
      if (wallet) {
        const monthlySpending = updatedData.expenses
          .filter(e => e.wallet_id === wallet.id && e.date.startsWith(expense.date.substring(0, 7)))
          .reduce((sum, e) => sum + e.amount, 0);

        if (monthlySpending >= wallet.monthly_limit) {
          const insight = await getSpendingInsights(wallet, updatedData.expenses);
          setAlert({ insight, walletName: wallet.name });
          await api.sendAlert({ insight, walletName: wallet.name, limit: wallet.monthly_limit });
        }
      }
    } catch (error) {
      console.error("Failed to add expense", error);
    }
  };

  const handleUpdateExpense = async (id: number, expense: Partial<Expense>) => {
    try {
      await api.updateExpense(id, expense);
      loadData();
    } catch (error) {
      console.error("Failed to update expense", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      loadData();
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const handleDownload = (type: 'weekly' | 'monthly', formatType: 'csv' | 'pdf') => {
    if (!data) return;
    
    const fileName = `expenses_${type}_${new Date().toISOString().split('T')[0]}`;

    if (formatType === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Amount,Category,Description\n"
        + data.expenses.map(e => `${e.date},${e.amount},${e.category},${e.description}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const doc = new jsPDF();
      doc.text(`Expense Report - ${type.toUpperCase()}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      const tableData = data.expenses.map(e => [
        e.date,
        `$${e.amount.toFixed(2)}`,
        e.category,
        e.description || "-"
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Amount', 'Category', 'Description']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.save(`${fileName}.pdf`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Sidebar / Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-white border-t md:border-t-0 md:border-r border-zinc-200 z-40 flex md:flex-col items-center justify-around md:justify-center gap-8 p-4">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`p-3 rounded-2xl transition-all ${activeTab === "dashboard" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-zinc-400 hover:bg-zinc-100"}`}
        >
          <LayoutDashboard size={24} />
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          className={`p-3 rounded-2xl transition-all ${activeTab === "stats" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-zinc-400 hover:bg-zinc-100"}`}
        >
          <PieChart size={24} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="md:ml-20 p-6 md:p-12 max-w-7xl mx-auto pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard 
                data={data!} 
                onAddExpense={handleAddExpense} 
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                onAddWallet={handleAddWallet}
                onUpdateWallet={() => {}} 
                onDownload={handleDownload}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Statistics</h1>
                <p className="text-zinc-500">Visual breakdown of your financial habits.</p>
              </div>
              <Stats expenses={data!.expenses} wallets={data!.wallets} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Alert Modal */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="bg-red-500 p-8 text-white relative">
                <button 
                  onClick={() => setAlert(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Spending Alert</span>
                </div>
                <h2 className="text-3xl font-bold">Limit Exceeded: {alert.walletName}</h2>
                <p className="mt-2 opacity-90">Our AI has analyzed your spending and prepared some insights to help you get back on track.</p>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto prose prose-zinc prose-sm max-w-none">
                <ReactMarkdown>{alert.insight}</ReactMarkdown>
              </div>
              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setAlert(null)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
