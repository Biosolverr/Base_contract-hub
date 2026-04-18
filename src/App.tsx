/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from './wagmi';
import { FACTORY_ABI, MARKETPLACE_ABI } from './abis';

// ══════════════════════════════════════════════════════
//  CONTRACT DATA
// ══════════════════════════════════════════════════════

const CONTRACTS_DATA = [
  {
    id: 'escrow',
    contractId: '0x' + 'e'.repeat(64),
    name: 'Secure Escrow',
    symbol: 'ESC',
    icon: '🔒',
    iconBg: 'rgba(0,200,150,0.12)',
    price: 'Free',
    priceEth: 0,
    priceUsdc: 0,
    rating: 4.9,
    ratingCount: 47,
    deploys: 312,
    author: '0x12…ab',
    authorFull: '0x12e4b6c18d3f9a2e5c7b8d1f3e5a7c9b11d13f1ab',
    verified: true,
    isActive: true,
    tags: ['defi', 'verified'],
    description: 'Two-party escrow with on-chain arbitration. Funds are locked until conditions are met by both parties. Supports ETH and ERC20 tokens. Arbiter can resolve disputes.',
    params: [
      { key: '_beneficiary', type: 'address', placeholder: '0x… beneficiary' },
      { key: '_arbiter', type: 'address', placeholder: '0x… arbiter' },
      { key: '_amount', type: 'uint256', placeholder: 'Amount in wei' }
    ],
    bytecodeVerified: true
  },
  {
    id: 'dao',
    contractId: '0x' + 'd'.repeat(64),
    name: 'DAO Treasury',
    symbol: 'DAOT',
    icon: '🏛️',
    iconBg: 'rgba(0,82,255,0.12)',
    price: '0.01 ETH',
    priceEth: 0.01,
    priceUsdc: 0,
    rating: 4.6,
    ratingCount: 28,
    deploys: 87,
    author: '0x88…fc',
    authorFull: '0x88a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8fc',
    verified: true,
    isActive: true,
    tags: ['dao', 'verified'],
    description: 'Multisig treasury with on-chain governance, timelocked execution, and quorum voting. Supports proposal lifecycle: create → vote → queue → execute.',
    params: [
      { key: '_owners', type: 'address[]', placeholder: 'Comma-separated owner addresses' },
      { key: '_required', type: 'uint256', placeholder: 'Required confirmations' },
      { key: '_delay', type: 'uint256', placeholder: 'Timelock delay (seconds)' }
    ],
    bytecodeVerified: true
  },
  {
    id: 'vesting',
    contractId: '0x' + 'a'.repeat(64),
    name: 'Token Vesting',
    symbol: 'VEST',
    icon: '📈',
    iconBg: 'rgba(255,184,0,0.1)',
    price: '0.005 ETH',
    priceEth: 0.005,
    priceUsdc: 0,
    rating: 4.8,
    ratingCount: 19,
    deploys: 54,
    author: '0x3d…11',
    authorFull: '0x3d5c7a9b1e3f5a7c9b1d3f5e7a9c1b3d5e7f9a11',
    verified: true,
    isActive: true,
    tags: ['defi', 'nft', 'verified'],
    description: 'Linear or cliff vesting schedule for team tokens and investors. Configurable cliff period, total duration, and revocable flag. Compatible with any ERC20.',
    params: [
      { key: '_beneficiary', type: 'address', placeholder: '0x… beneficiary' },
      { key: '_token', type: 'address', placeholder: '0x… ERC20 token address' },
      { key: '_start', type: 'uint256', placeholder: 'Start timestamp (unix)' },
      { key: '_duration', type: 'uint256', placeholder: 'Duration in seconds' },
      { key: '_cliff', type: 'uint256', placeholder: 'Cliff period in seconds' }
    ],
    bytecodeVerified: true
  }
];

export default function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { writeContract, data: hash, isPending: isTxPending, error: txError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [page, setPage] = useState('catalog');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [isDeployModalOpen, setDeployModalOpen] = useState(false);
  const [isRateModalOpen, setRateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [selectedRating, setSelectedRating] = useState(0);

  const handleRate = async () => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'rateContract',
        args: [selectedContract.contractId, BigInt(selectedRating)],
        account: address,
        chain: base,
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'purchaseLicense',
        args: [selectedContract.contractId],
        value: parseEther(selectedContract.priceEth.toString()),
        account: address,
        chain: base,
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeploy = async () => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    if (chainId !== base.id) {
       switchChain({ chainId: base.id });
       return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'deployContract',
        args: [selectedContract.contractId, 0n],
        value: parseEther('0.001'),
        account: address,
        chain: base,
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      showToast('Transaction confirmed!', 'success');
      setDeployModalOpen(false);
      setRateModalOpen(false);
    }
    if (txError) {
      showToast(txError.message, 'error');
    }
  }, [isConfirmed, txError]);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
  };

  const handleConnect = (connector: any) => {
    connect({ connector });
    setWalletModalOpen(false);
  };

  const filteredContracts = CONTRACTS_DATA.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'verified' && c.verified) || c.tags.includes(filter);
    return matchSearch && matchFilter;
  });

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  };

  return (
    <div className="app-container">
      <div className="app">
        
        {/* ── CATALOG PAGE ── */}
        {page === 'catalog' && (
          <div className="page active fade-in">
            <div className="status-bar">
              <span className="mono">9:41</span>
              <div className="status-net"><div className="net-dot"></div><span>Base Mainnet</span></div>
            </div>
            <div className="top-nav">
              <div className="nav-logo">Contract<span>Hub</span><sup>BASE</sup></div>
              <button 
                className={`wallet-btn ${isConnected ? 'connected' : ''} ${isPending ? 'connecting' : ''}`} 
                onClick={() => isConnected ? setPage('profile') : setWalletModalOpen(true)}
              >
                {isConnected ? `${address?.slice(0, 6)}…${address?.slice(-4)}` : 'Connect'}
              </button>
            </div>
            <div className="search-wrap">
              <div className="search-wrap-inner">
                <svg className="search-icon" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search contracts…" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="chips">
              {['all', 'verified', 'defi', 'dao', 'nft', 'vesting'].map(chip => (
                <div 
                  key={chip}
                  className={`chip ${filter === chip ? 'active' : ''}`}
                  onClick={() => setFilter(chip)}
                >
                  {chip === 'verified' ? '✓ Verified' : chip.charAt(0).toUpperCase() + chip.slice(1)}
                </div>
              ))}
            </div>
            <div className="section-header">
              <span className="section-title">Contracts</span>
              <span className="section-count mono">{filteredContracts.length} available</span>
            </div>
            <div className="cards">
              {filteredContracts.map(c => (
                <div key={c.id} className="card" onClick={() => { setSelectedContract(c); setPage('detail'); }}>
                  <div className="card-head">
                    <div className="card-left">
                      <div className="card-icon" style={{ background: c.iconBg }}>{c.icon}</div>
                      <div>
                        <div className="card-title">
                          {c.name} {c.verified && <span className="badge-verified" style={{ fontSize: '9px', padding: '1px 6px' }}>✓</span>}
                        </div>
                        <div className="card-symbol">{c.symbol} · {c.author}</div>
                      </div>
                    </div>
                    <span className={`card-badge ${c.priceEth === 0 ? 'badge-free' : 'badge-paid'}`}>{c.price}</span>
                  </div>
                  <div className="card-desc">{c.description.slice(0, 90)}…</div>
                  <div className="card-meta">
                    <div className="meta-item"><span className="stars">{renderStars(c.rating)}</span> <b>{c.rating}</b></div>
                    <div className="meta-item">Deploys: <b>{c.deploys}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DETAIL PAGE ── */}
        {page === 'detail' && selectedContract && (
          <div className="page active fade-in">
            <div className="status-bar">
              <span className="mono">9:41</span>
              <div className="status-net"><div className="net-dot"></div><span>Base Mainnet</span></div>
            </div>
            <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
              <div className="detail-back" onClick={() => setPage('catalog')}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to catalog
              </div>
              <div className="detail-icon" style={{ background: selectedContract.iconBg }}>{selectedContract.icon}</div>
              <div className="detail-name-row">
                <div className="detail-title">{selectedContract.name}</div>
                {selectedContract.verified && <span className="badge-verified">✓ verified</span>}
              </div>
              <div className="detail-author">By {selectedContract.author} · {selectedContract.authorFull.slice(0, 10)}…</div>
              <div className="detail-stats">
                <div className="stat">
                  <div className="stat-val"><span className="stars">★</span> {selectedContract.rating}</div>
                  <div className="stat-key">Rating</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{selectedContract.deploys}</div>
                  <div className="stat-key">Deploys</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{selectedContract.price}</div>
                  <div className="stat-key">License</div>
                </div>
              </div>
              <div style={{ padding: '12px 0 16px' }}>
                <div className="action-title">Description</div>
                <div style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.6 }}>{selectedContract.description}</div>
              </div>
            </div>
            <div className="action-section">
              <div className="action-title">Actions</div>
              <button className="btn-primary" onClick={() => setDeployModalOpen(true)}>Deploy this contract</button>
              <button className="btn-secondary" onClick={() => setRateModalOpen(true)}>Rate · leave review</button>
            </div>
            <div className="params-section">
              <div className="action-title">Constructor params</div>
              {selectedContract.params.map((p: any) => (
                <div key={p.key} className="param-row">
                  <span className="param-key">{p.key}</span>
                  <span className="param-val">{p.type}</span>
                </div>
              ))}
              <div className="param-row">
                <span className="param-key">Bytecode</span>
                <span className="param-val" style={{ color: 'var(--green)' }}>verified ✓</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PUBLISH PAGE ── */}
        {page === 'publish' && (
          <div className="page active fade-in">
             <div className="status-bar">
              <span className="mono">9:41</span>
              <div className="status-net"><div className="net-dot"></div><span>Base Mainnet</span></div>
            </div>
            <div className="top-nav">
              <div className="nav-logo">Publish</div>
              <button className="wallet-btn" onClick={() => setPage('catalog')}>Cancel</button>
            </div>
            <div className="publish-form" style={{ padding: '16px' }}>
              <div className="form-group">
                <label className="form-label">Contract Name</label>
                <input type="text" className="modal-input" placeholder="e.g. MultiSig Safe" />
              </div>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input type="text" className="modal-input" placeholder="e.g. MSIG" />
              </div>
              <div className="deposit-notice">
                <div className="notice-label" style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', marginBottom: '4px' }}>Deposit Required</div>
                Registering a contract requires a <strong>0.001 ETH</strong> deposit on Base.
              </div>
              <button className="btn-primary" onClick={() => showToast('Listing functionality simulation')}>Publish on Base</button>
            </div>
          </div>
        )}

        {/* ── PROFILE PAGE ── */}
        {page === 'profile' && (
          <div className="page active fade-in">
            <div className="status-bar">
              <span className="mono">9:41</span>
              <div className="status-net"><div className="net-dot"></div><span>Base Mainnet</span></div>
            </div>
            <div className="top-nav">
              <div className="nav-logo">Profile</div>
              <button className="wallet-btn connected" onClick={() => { disconnect(); setPage('catalog'); }}>Disconnect</button>
            </div>
            <div className="profile-card">
              <div className="profile-avatar">👤</div>
              <div className="profile-addr">{isConnected ? `${address}` : 'Not connected'}</div>
              <div className="profile-rep">Reputation score: 15</div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <span className="chain-badge"><span className="chain-icon"></span>Base Mainnet</span>
              </div>
            </div>
            <div className="profile-section" style={{ padding: '0 16px 16px' }}>
              <div className="profile-section-title" style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', marginBottom: '10px' }}>My Deployments</div>
              <div className="list-empty" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--t3)' }}>
                No deployments yet on Base Mainnet.
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <div className="bottom-nav">
          <div className={`bnav-item ${['catalog', 'detail'].includes(page) ? 'active' : ''}`} onClick={() => setPage('catalog')}>
            <svg className="bnav-icon" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" opacity="0.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" opacity="0.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" opacity="0.3"/>
            </svg>
            <span>Catalog</span>
          </div>
          <div className={`bnav-item ${page === 'publish' ? 'active' : ''}`} onClick={() => setPage('publish')}>
            <svg className="bnav-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="10" y1="6.5" x2="10" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="6.5" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Publish</span>
          </div>
          <div className={`bnav-item ${page === 'profile' ? 'active' : ''}`} onClick={() => setPage('profile')}>
            <svg className="bnav-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Profile</span>
          </div>
        </div>

        {/* ── MODALS ── */}
        
        {/* Deploy Modal */}
        <div className={`modal-overlay ${isDeployModalOpen ? 'open' : ''}`} onClick={() => setDeployModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Deploy {selectedContract?.name}</div>
            <div className="modal-sub">{selectedContract?.symbol} · Fill constructor params</div>
            
            <div className="deploy-params">
              {selectedContract?.params.map((p: any) => (
                <div key={p.key} className="form-group">
                  <label className="form-label">{p.key} ({p.type})</label>
                  <input className="modal-input" placeholder={p.placeholder} type="text" />
                </div>
              ))}
            </div>

            <div className="cost-block">
              <div className="cost-row">
                <span className="cost-key">License fee</span>
                <span className={`cost-val ${selectedContract?.priceEth === 0 ? 'green' : 'blue'}`}>{selectedContract?.price}</span>
              </div>
              <div className="cost-row">
                <span className="cost-key">Deposit (minDeposit)</span>
                <span className="cost-val blue">0.001 ETH</span>
              </div>
            </div>

            {isTxPending || isConfirming ? (
              <div className="tx-state">
                <div className="tx-spinner"></div>
                <div className="tx-label">{isConfirming ? 'Confirming on chain...' : 'Waiting for wallet...'}</div>
              </div>
            ) : (
              <>
                <button className="btn-primary" onClick={handleDeploy}>Confirm & Deploy on Base</button>
                <div style={{ height: '8px' }}></div>
                <button className="btn-ghost" onClick={() => setDeployModalOpen(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>

        {/* Rate Modal */}
        <div className={`modal-overlay ${isRateModalOpen ? 'open' : ''}`} onClick={() => setRateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Rate Contract</div>
            <div className="modal-sub">{selectedContract?.name} · stored on-chain</div>
            <div className="rate-stars">
              {[1, 2, 3, 4, 5].map(val => (
                <span 
                  key={val} 
                  className={`rate-star ${selectedRating >= val ? 'active' : ''}`} 
                  onClick={() => setSelectedRating(val)}
                  style={{ opacity: selectedRating >= val ? 1 : 0.3, filter: selectedRating >= val ? 'none' : 'grayscale(1)' }}
                >
                  ★
                </span>
              ))}
            </div>
            <button className="btn-primary" disabled={selectedRating === 0 || isTxPending} onClick={handleRate}>
              {isTxPending ? 'Submitting...' : 'Submit Rating'}
            </button>
            <div style={{ height: '8px' }}></div>
            <button className="btn-ghost" onClick={() => setRateModalOpen(false)}>Cancel</button>
          </div>
        </div>
        <div className={`modal-overlay ${isWalletModalOpen ? 'open' : ''}`} onClick={() => setWalletModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Connect Wallet</div>
            <div className="modal-sub">Choose your wallet to interact with Base</div>
            <div className="wallet-options">
              {connectors.map(connector => (
                <div key={connector.id} className="wallet-option" onClick={() => handleConnect(connector)}>
                   <div className="wallet-logo" style={{ background: 'rgba(0,82,255,0.1)' }}>
                    {connector.name === 'MetaMask' ? '🦊' : connector.name === 'Coinbase Wallet' ? '🔵' : '🔗'}
                  </div>
                  <div>
                    <div className="wallet-name">{connector.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => setWalletModalOpen(false)}>Cancel</button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="toast-wrap">
            <div className={`toast show ${toast.type}`}>
              <div className="toast-dot"></div>
              <span>{toast.msg}</span>
            </div>
          </div>
        )}

        {/* ── FOOTER с двумя ссылками на GitHub ── */}
        <footer style={{
          marginTop: '40px',
          padding: '20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/Biosolverr/Base_contract-hub"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0052FF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.52 2.36 1.08 2.93.83.09-.65.35-1.09.64-1.34-2.24-.25-4.6-1.12-4.6-4.98 0-1.1.39-2 1.03-2.71-.1-.25-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.43.1 2.68.64.71 1.03 1.61 1.03 2.71 0 3.87-2.36 4.73-4.62 4.98.36.31.69.92.69 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              Frontend
            </a>
            <a
              href="https://github.com/Biosolverr/Biosolverr-contract-hub-contract"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0052FF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.52 2.36 1.08 2.93.83.09-.65.35-1.09.64-1.34-2.24-.25-4.6-1.12-4.6-4.98 0-1.1.39-2 1.03-2.71-.1-.25-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.43.1 2.68.64.71 1.03 1.61 1.03 2.71 0 3.87-2.36 4.73-4.62 4.98.36.31.69.92.69 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              Smart Contracts
            </a>
          </div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            © 2025 ContractHub — Trustless. Atomic. On Base.
          </div>
        </footer>

      </div>
    </div>
  );
}
