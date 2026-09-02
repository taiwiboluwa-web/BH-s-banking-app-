import { useState } from 'react';
import { ArrowUpRight, Check, ShieldCheck, X } from 'lucide-react';

export type ServiceKind = 'Airtime' | 'Data' | 'Electricity' | 'TV' | 'International' | 'Multi-currency';
export type ServiceRecord = { title: string; subtitle: string; amount: string };

type Props = { kind: ServiceKind; onClose: () => void; onComplete: (record: ServiceRecord) => void };

const plans = { '10 GB · ₦3,000': 3000, '20 GB · ₦5,000': 5000, '50 GB · ₦10,000': 10000 };
const packages = { 'Compact · ₦15,000': 15000, 'Premium · ₦25,000': 25000, 'Confam · ₦7,400': 7400 };
const rates: Record<string, number> = { 'NGN-USD': 1 / 1550, 'USD-NGN': 1550, 'GBP-NGN': 2050, 'EUR-NGN': 1800, 'NGN-GBP': 1 / 2050, 'NGN-EUR': 1 / 1800, 'USD-EUR': 0.86, 'EUR-USD': 1.16, 'GBP-USD': 1.34, 'USD-GBP': 0.75, 'GBP-EUR': 1.16, 'EUR-GBP': 0.86 };

function ServiceFlow({ kind, onClose, onComplete }: Props) {
  const [step, setStep] = useState<'form' | 'review' | 'result'>('form');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [plan, setPlan] = useState(Object.keys(plans)[0]);
  const [provider, setProvider] = useState('Ikeja Electric');
  const [meter, setMeter] = useState('');
  const [meterType, setMeterType] = useState('Prepaid');
  const [tvProvider, setTvProvider] = useState('DStv');
  const [iuc, setIuc] = useState('');
  const [tvPackage, setTvPackage] = useState(Object.keys(packages)[0]);
  const [country, setCountry] = useState('United Kingdom');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('NGN');
  const [to, setTo] = useState('USD');
  const [error, setError] = useState('');

  const title = kind === 'Multi-currency' ? 'Currency exchange' : kind === 'International' ? 'International transfer' : kind;
  const value = Number(amount.replace(/,/g, ''));
  const converted = value > 0 ? value * (rates[`${from}-${to}`] || 1) : 0;
  const symbol = (code: string) => ({ NGN: '₦', USD: '$', GBP: '£', EUR: '€' }[code] || code);

  function review() {
    const phoneOk = /^\d{10,14}$/.test(phone.replace(/\D/g, ''));
    if ((kind === 'Airtime' && (!phoneOk || value <= 0)) || (kind === 'Data' && !phoneOk)) return setError('Enter a valid Nigerian phone number.');
    if (kind === 'Electricity' && (!meter.trim() || value <= 0)) return setError('Enter the meter number and a valid amount.');
    if (kind === 'TV' && !iuc.trim()) return setError('Enter the smart-card or IUC number.');
    if (kind === 'International' && (!recipient.trim() || value <= 0)) return setError('Enter the recipient and a valid amount.');
    if (kind === 'Multi-currency' && (value <= 0 || from === to)) return setError('Choose different currencies and enter an amount.');
    if (kind === 'Data') setAmount(String(plans[plan as keyof typeof plans]));
    if (kind === 'TV') setAmount(String(packages[tvPackage as keyof typeof packages]));
    setError(''); setStep('review');
  }

  function confirm() {
    const finalValue = Number((amount || String(kind === 'Data' ? plans[plan as keyof typeof plans] : kind === 'TV' ? packages[tvPackage as keyof typeof packages] : 0)).replace(/,/g, ''));
    const subtitle = kind === 'Airtime' || kind === 'Data' ? `${network} · ${phone}` : kind === 'Electricity' ? `${provider} · ${meterType} · ${meter}` : kind === 'TV' ? `${tvProvider} · ${iuc}` : kind === 'International' ? `${country} · ${recipient}` : `${from} → ${to}`;
    const amountText = kind === 'Multi-currency' ? `-${symbol(from)}${finalValue.toLocaleString()}` : `-₦${finalValue.toLocaleString()}`;
    onComplete({ title: kind === 'Airtime' ? 'Airtime purchase' : kind === 'Data' ? 'Data bundle' : kind === 'Electricity' ? 'Electricity payment' : kind === 'TV' ? 'TV subscription' : title, subtitle, amount: amountText });
    setStep('result');
  }

  return <div className="overlay"><div className="sheet"><div className="sheet-head"><div><p className="kicker">{kind === 'International' ? 'GLOBAL PAYMENTS' : kind === 'Multi-currency' ? 'MULTI-CURRENCY' : 'BILLS & SERVICES'}</p><h2>{step === 'form' ? title : step === 'review' ? 'Review request' : 'Request recorded'}</h2></div><button aria-label="Close service" onClick={onClose}><X/></button></div>
    {step === 'form' && <div className="service-form">
      {(kind === 'Airtime' || kind === 'Data') && <><label>Phone number<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678"/></label><label>Network<select value={network} onChange={(e) => setNetwork(e.target.value)}><option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option></select></label>{kind === 'Airtime' ? <label>Amount<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦5,000"/></label> : <label>Data plan<select value={plan} onChange={(e) => setPlan(e.target.value)}>{Object.keys(plans).map((p) => <option key={p}>{p}</option>)}</select></label>}</>}
      {kind === 'Electricity' && <><label>Disco / provider<select value={provider} onChange={(e) => setProvider(e.target.value)}><option>Ikeja Electric</option><option>Eko Electricity</option><option>Abuja Electricity</option><option>Ibadan Electricity</option></select></label><label>Meter type<select value={meterType} onChange={(e) => setMeterType(e.target.value)}><option>Prepaid</option><option>Postpaid</option></select></label><label>Meter number<input value={meter} onChange={(e) => setMeter(e.target.value)} placeholder="Enter meter number"/></label><label>Amount<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦10,000"/></label></>}
      {kind === 'TV' && <><label>TV provider<select value={tvProvider} onChange={(e) => setTvProvider(e.target.value)}><option>DStv</option><option>GOtv</option><option>Startimes</option></select></label><label>Smart-card / IUC<input value={iuc} onChange={(e) => setIuc(e.target.value)} placeholder="Enter customer number"/></label><label>Package<select value={tvPackage} onChange={(e) => setTvPackage(e.target.value)}>{Object.keys(packages).map((p) => <option key={p}>{p}</option>)}</select></label></>}
      {kind === 'International' && <><label>Destination country<select value={country} onChange={(e) => setCountry(e.target.value)}><option>United Kingdom</option><option>United States</option><option>Ghana</option><option>Canada</option></select></label><label>Recipient<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient name / account"/></label><label>Amount<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦0.00"/></label></>}
      {kind === 'Multi-currency' && <><label>From<select value={from} onChange={(e) => setFrom(e.target.value)}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label><label>To<select value={to} onChange={(e) => setTo(e.target.value)}><option>USD</option><option>NGN</option><option>GBP</option><option>EUR</option></select></label><label>Amount<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"/></label>{value > 0 && from !== to && <div className="review-card"><div><span>ESTIMATED RECEIPT</span><strong>{symbol(to)}{converted.toFixed(2)}</strong></div><small>Demo rate preview · provider settlement not connected</small></div>}</>}
      {error && <p className="form-error">{error}</p>}<div className="transfer-note"><ShieldCheck size={17}/><span>Sandbox request only. No provider is connected and no real funds or bill payments are settled.</span></div><button className="primary wide" onClick={review}>Review {title} <ArrowUpRight size={17}/></button>
    </div>}
    {step === 'review' && <><div className="review-card"><div><span>SERVICE</span><strong>{title}</strong></div><div><span>DETAILS</span><strong>{kind === 'Airtime' || kind === 'Data' ? `${network} · ${phone}` : kind === 'Electricity' ? `${provider} · ${meterType} · ${meter}` : kind === 'TV' ? `${tvProvider} · ${iuc}` : kind === 'International' ? `${country} · ${recipient}` : `${from} → ${to}`}</strong></div><div><span>AMOUNT</span><strong>{kind === 'Multi-currency' ? `${symbol(from)}${amount} → ${symbol(to)}${converted.toFixed(2)}` : `₦${Number(amount || (kind === 'Data' ? plans[plan as keyof typeof plans] : kind === 'TV' ? packages[tvPackage as keyof typeof packages] : 0)).toLocaleString()}`}</strong></div><div><span>STATUS</span><strong>Sandbox · Ready to submit</strong></div></div><div className="transfer-note"><ShieldCheck size={17}/><span>Review complete. This creates a visible Activity record only.</span></div><button className="primary wide" onClick={confirm}>Confirm sandbox request <Check size={17}/></button><button className="text-button" onClick={() => setStep('form')}>Edit details</button></>}
    {step === 'result' && <div className="result-state"><span className="result-icon"><Check size={26}/></span><p className="kicker">REQUEST RECORDED</p><h2>{title} is now in Activity.</h2><p className="muted">Sandbox only — no real provider was charged. The request is marked processing until a legitimate provider connection is added.</p><button className="primary wide" onClick={onClose}>Done</button></div>}
  </div></div>;
}

export default ServiceFlow;
