import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import Header from './components/Header';
import Footer from './components/Footer';
import TokenBalance from './components/TokenBalance';
import TransferForm from './components/TransferForm';
import ApprovalForm from './components/ApprovalForm';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('balance');

  return (
    <Web3Provider>
      <div className="app-container">
        <Header />
        
        <div className="tab-navigation">
          <button 
            className={activeTab === 'balance' ? 'active' : ''} 
            onClick={() => setActiveTab('balance')}
          >
            Balance
          </button>
          <button 
            className={activeTab === 'transfer' ? 'active' : ''} 
            onClick={() => setActiveTab('transfer')}
          >
            Transfer
          </button>
          <button 
            className={activeTab === 'approve' ? 'active' : ''} 
            onClick={() => setActiveTab('approve')}
          >
            Approve
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''} 
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        
        <main className="main-content">
          {activeTab === 'balance' && <TokenBalance />}
          {activeTab === 'transfer' && <TransferForm />}
          {activeTab === 'approve' && <ApprovalForm />}
          {activeTab === 'history' && <TransactionHistory />}
        </main>
        
        <Footer />
      </div>
    </Web3Provider>
  );
}

export default App;