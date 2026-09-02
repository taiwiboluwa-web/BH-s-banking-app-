import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowDownLeft, ArrowUpRight, Bell, ChevronRight, CreditCard, Eye, EyeOff, Globe2, Home, Menu, MoreHorizontal, Plus, ReceiptText, Send, Settings, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';

type Tx = { id: string; title: string; subtitle: string; amount: string; positive?: boolean; date: string };
const demoTx: Tx[] = [
  { id: '1', title: 'Transfer received', subtitle: 'From Chinedu Okafor', amount: '+₦185,000', positive: true, date: 'Today, 10:42' },
  { id: '2', title: 'Netflix', subtitle: 'Card •••• 4821', amount: '-₦7,100', date: 'Yesterday, 18:20' },
  { id: '3', title: 'Airtime', subtitle: 'MTN Nigeria', amount: '-₦5,000', date: 'Aug 31, 13:08' },
  { id: '4', title: 'USD conversion', subtitle: 'USD wallet', amount: '-$100', date: 'Aug 30, 09:15' },
];

function App() {
  const [tab, setTab] = useState('Home');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currency, setCurrency] = useState('NGN');
  const [balance, setBalance] = useState(1247850);
  const [txs, setTxs] = useState<Tx[]>(demoTx);
  const [showSend, setShowSend] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { api.get('/api/health').catch(() => undefined); }, []);

  const formatted = useMemo(() => currency === 'NGN' ? `₦${balance.toLocaleString('en-NG')}.00` : `$${(balance / 1550).toFixed(2)}`, [balance, currency]);

  async function sendMoney() {
    const value = Number(amount.replace(/,/g, ''));
    if (!recipient.trim() || !Number.isFinite(value) || value <= 0) return setNotice('Enter a recipient and a valid amount.');
    if (currency === 'NGN' && value > balance) return setNotice('Insufficient balance for this demo transfer.');
    try { await api.post('/api/transfers', { recipient: recipient.trim(), amount: value, currency }); } catch { /* demo remains usable if backend is unavailable */ }
    setBalance((b) => currency === 'NGN' ? b - value : b);
    setTxs((items) => [{ id: crypto.randomUUID(), title: 'Transfer sent', subtitle: recipient.trim(), amount: `-${currency === 'NGN' ? '₦' : '$'}${value.toLocaleString()}`, date: 'Just now' }, ...items]);
    setNotice('Transfer created successfully in sandbox mode.');
    setRecipient(''); setAmount(''); setShowSend(false);
  }

  const quick = [
    { label: 'Send', icon: Send, action: () => setShowSend(true) },
    { label: 'Receive', icon: ArrowDownLeft, action: () => setNotice('Your BH\'S receiving details are ready to share.') },
    { label: 'Airtime', icon: Sparkles, action: () => setNotice('Airtime hub opened.') },
    { label: 'Bills', icon: ReceiptText, action: () => setNotice('Bills hub opened.') },
  ];

  return <div className="shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">BH</span><span>BH'S</span></div>
      <div className="top-actions"><button aria-label="Notifications" onClick={() => setNotice('You have 2 new notifications.')}><Bell size={19}/><i/></button><button aria-label="Menu" onClick={() => setShowMore(true)}><Menu size={21}/></button></div>
    </header>
    <main>
      {tab === 'Home' && <>
        <section className="hero">
          <div className="eyebrow"><span>AVAILABLE BALANCE</span><button onClick={() => setBalanceVisible(!balanceVisible)}>{balanceVisible ? <Eye size={17}/> : <EyeOff size={17}/>}</button></div>
          <div className="balance">{balanceVisible ? formatted : '••••••••'}</div>
          <div className="balance-row"><span>Primary wallet</span><button onClick={() => setCurrency(currency === 'NGN' ? 'USD' : 'NGN')}>{currency} <ChevronRight size={14}/></button></div>
          <div className="hero-actions"><button onClick={() => setShowSend(true)}><Send size={17}/> Send money</button><button onClick={() => setNotice('Receiving details copied to your clipboard.')}><ArrowDownLeft size={17}/> Receive</button></div>
        </section>
        <section className="quick-grid">{quick.map(({ label, icon: Icon, action }) => <button key={label} onClick={action}><span><Icon size={20}/></span>{label}</button>)}</section>
        <section className="section"><div className="section-head"><div><p className="kicker">MOVE MONEY</p><h2>Bank beyond borders.</h2></div><Globe2 size={24}/></div>
          <div className="feature-grid"><button onClick={() => setNotice('International transfer flow opened.')}><span className="feature-icon"><Globe2 size={20}/></span><strong>International</strong><small>Send USD, GBP & EUR</small><ChevronRight size={17}/></button><button onClick={() => setNotice('Multi-currency wallet opened.')}><span className="feature-icon"><Wallet size={20}/></span><strong>Multi-currency</strong><small>Hold & convert currencies</small><ChevronRight size={17}/></button></div>
        </section>
        <section className="section transactions"><div className="section-head"><div><p className="kicker">ACTIVITY</p><h2>Recent transactions</h2></div><button className="link" onClick={() => setTab('Activity')}>See all</button></div>{txs.slice(0, 4).map((tx) => <Transaction key={tx.id} tx={tx}/>)}</section>
      </>}
      {tab === 'Activity' && <section className="page"><p className="kicker">ACTIVITY</p><h1>Transaction history</h1><p className="muted">Every movement, in one place.</p><div className="filter-row"><button className="active">All</button><button>Money in</button><button>Money out</button></div>{txs.map((tx) => <Transaction key={tx.id} tx={tx}/>)}</section>}
      {tab === 'Cards' && <section className="page"><p className="kicker">CARDS</p><h1>Your BH'S card</h1><div className="bank-card"><div className="card-top"><span>BH'S</span><span>VISA</span></div><div className="chip">▦</div><div className="card-number">4821&nbsp;&nbsp; 9012&nbsp;&nbsp; 3418&nbsp;&nbsp; 2046</div><div className="card-bottom"><span>TAIWO B.</span><span>09/29</span></div></div><div className="card-tools"><button onClick={() => setNotice('Virtual card frozen in sandbox mode.')}><ShieldCheck size={19}/> Freeze card</button><button onClick={() => setNotice('Card limits opened.')}><Settings size={19}/> Card controls</button></div></section>}
      {tab === 'Wallet' && <section className="page"><p className="kicker">WALLETS</p><h1>One account. Many currencies.</h1><p className="muted">Keep your money close, wherever it lives.</p><div className="wallet-list"><WalletRow code="NGN" name="Naira wallet" amount="₦1,247,850.00"/><WalletRow code="USD" name="US Dollar" amount="$804.25"/><WalletRow code="GBP" name="British Pound" amount="£120.00"/><WalletRow code="EUR" name="Euro" amount="€90.00"/></div><button className="outline wide" onClick={() => setNotice('New currency wallet flow opened.')}><Plus size={18}/> Add currency</button></section>}
    </main>
    <nav className="bottom-nav">{[['Home','Home',Home],['Wallet','Wallet',Wallet],['Cards','Cards',CreditCard],['Activity','Activity',ReceiptText]].map(([id,label,Icon]) => <button className={tab===id?'selected':''} key={label as string} onClick={() => setTab(id as string)}><Icon size={20}/><span>{label}</span></button>)}</nav>
    {showSend && <div className="overlay"><div className="sheet"><div className="sheet-head"><div><p className="kicker">TRANSFER</p><h2>Send money</h2></div><button onClick={() => setShowSend(false)}><X/></button></div><label>Recipient<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name, account or phone"/></label><label>Amount<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={currency === 'NGN' ? '₦0.00' : '$0.00'}/></label><div className="transfer-note"><ShieldCheck size={17}/><span>BH'S secure sandbox transfer. No real funds are moved.</span></div>{notice && <p className="form-error">{notice}</p>}<button className="primary wide" onClick={sendMoney}>Review transfer <ArrowUpRight size={17}/></button></div></div>}
    {showMore && <div className="overlay"><div className="sheet compact"><button className="close" onClick={() => setShowMore(false)}><X/></button><div className="profile-mark">TB</div><h2>Welcome to BH'S</h2><p className="muted">Transaction Beyond Borders</p><button className="menu-row" onClick={() => setNotice('Security centre opened.')}><ShieldCheck/> Security centre <ChevronRight/></button><button className="menu-row" onClick={() => setNotice('Settings opened.')}><Settings/> Settings <ChevronRight/></button><button className="menu-row" onClick={() => setNotice('Help centre opened.')}><MoreHorizontal/> Help centre <ChevronRight/></button></div></div>}
    {notice && !showSend && <button className="toast" onClick={() => setNotice('')}>{notice}<X size={15}/></button>}
  </div>
}
function Transaction({ tx }: { tx: Tx }) { return <div className="tx"><div className="tx-icon">{tx.positive ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</div><div className="tx-copy"><strong>{tx.title}</strong><span>{tx.subtitle}</span></div><div className={tx.positive ? 'tx-amount positive' : 'tx-amount'}><strong>{tx.amount}</strong><span>{tx.date}</span></div></div> }
function WalletRow({ code, name, amount }: { code: string; name: string; amount: string }) { return <div className="wallet-row"><span className="currency">{code}</span><div><strong>{name}</strong><small>Available</small></div><strong>{amount}</strong></div> }
export default App;
