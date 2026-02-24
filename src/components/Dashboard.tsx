import React, { useState } from "react";
import { Wallet, Expense } from "../types";
import { Plus, Wallet as WalletIcon, TrendingUp, AlertCircle, Download, X, Edit2, Trash2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";

interface AppProps {
  data: { wallets: Wallet[]; expenses: Expense[] };
  onAddExpense: (expense: any) => void;
  onUpdateExpense: (id: number, expense: any) => void;
  onDeleteExpense: (id: number) => void;
  onAddWallet: (wallet: any) => void;
  onUpdateWallet: (id: number, wallet: any) => void;
  onDownload: (type: 'weekly' | 'monthly', format: 'csv' | 'pdf') => void;
}

export const Dashboard: React.FC<AppProps> = ({ 
  data, onAddExpense, onUpdateExpense, onDeleteExpense, onAddWallet, onUpdateWallet, onDownload 
}) => {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const [newExpense, setNewExpense] = useState({
    wallet_id: data.wallets[0]?.id || 0,
    amount: "",
    category: "Food",
    description: "",
    date: format(new Date(), "yyyy-MM-dd")
  });

  const [newWallet, setNewWallet] = useState({
    name: "",
    balance: "",
    monthly_limit: ""
  });

  const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      ...newExpense,
      amount: parseFloat(newExpense.amount as string)
    });
    setShowExpenseModal(false);
    setNewExpense({ ...newExpense, amount: "", description: "" });
  };

  const handleSubmitWallet = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWallet({
      name: newWallet.name,
      balance: parseFloat(newWallet.balance),
      monthly_limit: parseFloat(newWallet.monthly_limit)
    });
    setShowWalletModal(false);
    setNewWallet({ name: "", balance: "", monthly_limit: "" });
  };

  const handleSubmitEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    onUpdateExpense(editingExpense.id, {
      ...editingExpense,
      amount: parseFloat(editingExpense.amount as any)
    });
    setEditingExpense(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500">Track your daily spending and manage your wallets.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <button 
              onClick={() => onDownload('monthly', 'csv')}
              className="px-3 py-2 text-xs font-medium hover:bg-zinc-50 border-r border-zinc-200"
            >
              CSV
            </button>
            <button 
              onClick={() => onDownload('monthly', 'pdf')}
              className="px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            >
              PDF
            </button>
          </div>
          <button 
            onClick={() => setShowWalletModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <WalletIcon size={16} /> Add Wallet
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.wallets.map(wallet => {
          const monthlySpending = data.expenses
            .filter(e => e.wallet_id === wallet.id && e.date.startsWith(format(new Date(), "yyyy-MM")))
            .reduce((sum, e) => sum + e.amount, 0);
          
          const limitReached = monthlySpending >= wallet.monthly_limit;

          return (
            <motion.div 
              key={wallet.id}
              layoutId={`wallet-${wallet.id}`}
              className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <WalletIcon size={20} className="text-zinc-600" />
                </div>
                {limitReached && (
                  <div className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={14} /> Limit Reached
                  </div>
                )}
              </div>
              <h3 className="text-zinc-500 text-sm font-medium">{wallet.name}</h3>
              <div className="text-2xl font-bold mt-1">${wallet.balance.toLocaleString()}</div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Monthly Limit</span>
                  <span className="text-zinc-900">${monthlySpending.toLocaleString()} / ${wallet.monthly_limit.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((monthlySpending / wallet.monthly_limit) * 100, 100)}%` }}
                    className={`h-full rounded-full ${limitReached ? 'bg-red-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Wallet Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">Add New Wallet</h2>
                <button onClick={() => setShowWalletModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitWallet} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Wallet Name</label>
                  <input 
                    type="text" 
                    required
                    value={newWallet.name}
                    onChange={e => setNewWallet({...newWallet, name: e.target.value})}
                    placeholder="e.g. Savings, Travel"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Initial Balance</label>
                  <input 
                    type="number" 
                    required
                    value={newWallet.balance}
                    onChange={e => setNewWallet({...newWallet, balance: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Monthly Spending Limit</label>
                  <input 
                    type="number" 
                    required
                    value={newWallet.monthly_limit}
                    onChange={e => setNewWallet({...newWallet, monthly_limit: e.target.value})}
                    placeholder="1000.00"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-lg"
                >
                  Create Wallet
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">Add New Expense</h2>
                <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Wallet</label>
                  <select 
                    value={newExpense.wallet_id}
                    onChange={e => setNewExpense({...newExpense, wallet_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Amount</label>
                    <input 
                      type="number" 
                      required
                      value={newExpense.amount}
                      onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="What was this for?"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Save Expense
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recent Transactions */}
      <div className="mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600">
              <Filter size={14} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-zinc-300">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
          {data.expenses
            .filter(expense => {
              const matchesCategory = filterCategory === "All" || expense.category === filterCategory;
              const expenseDate = parseISO(expense.date);
              const matchesDate = isWithinInterval(expenseDate, {
                start: parseISO(startDate),
                end: parseISO(endDate)
              });
              return matchesCategory && matchesDate;
            })
            .slice(0, 20).map((expense, idx, filteredArray) => (
            <div key={expense.id} className={`p-4 flex items-center justify-between ${idx !== filteredArray.length - 1 ? 'border-b border-zinc-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                  {expense.category[0]}
                </div>
                <div>
                  <p className="font-semibold">{expense.description || expense.category}</p>
                  <p className="text-xs text-zinc-400">{format(new Date(expense.date), "MMM dd, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-red-500">-${expense.amount}</p>
                  <p className="text-xs text-zinc-400">{expense.category}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingExpense(expense)}
                    className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Expense Modal */}
      <AnimatePresence>
        {editingExpense && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Expense</h2>
                <button onClick={() => setEditingExpense(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitEditExpense} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Wallet</label>
                  <select 
                    value={editingExpense.wallet_id}
                    onChange={e => setEditingExpense({...editingExpense, wallet_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Amount</label>
                    <input 
                      type="number" 
                      required
                      value={editingExpense.amount}
                      onChange={e => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value)})}
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                    <select 
                      value={editingExpense.category}
                      onChange={e => setEditingExpense({...editingExpense, category: e.target.value})}
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={editingExpense.description}
                    onChange={e => setEditingExpense({...editingExpense, description: e.target.value})}
                    placeholder="What was this for?"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={editingExpense.date}
                    onChange={e => setEditingExpense({...editingExpense, date: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Update Expense
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
