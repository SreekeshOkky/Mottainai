'use client';

import { useState, useEffect } from 'react';
import { addItem, getItems, canAddItemToday, DAILY_ITEM_LIMIT, MottainaiItem } from '@/lib/db';
import { resolveLocationCurrency, detectCurrency, type CurrencyInfo } from '@/lib/currency';
import ChatModal from '@/components/ChatModal';
import styles from './page.module.css';

export default function Home() {
  const [items, setItems] = useState<MottainaiItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [canAdd, setCanAdd] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MottainaiItem | null>(null);
  const [isClient, setIsClient] = useState(false);
  // Start with a synchronous timezone guess; upgrade to GPS once resolved
  const [currency, setCurrency] = useState<CurrencyInfo>(detectCurrency());

  useEffect(() => {
    setIsClient(true);
    loadData();
    // Resolve real location in background; update currency when ready
    resolveLocationCurrency().then(setCurrency);
  }, []);

  const loadData = async () => {
    const fetchedItems = await getItems();
    setItems(fetchedItems.sort((a, b) => b.createdAt - a.createdAt));
    const allowed = await canAddItemToday();
    setCanAdd(allowed);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !canAdd) return;
    
    try {
      await addItem(newItemName.trim());
      setNewItemName('');
      await loadData();
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Could not add item. Limit reached?');
    }
  };

  const handleItemUpdate = () => {
    loadData();
    setSelectedItem(null);
  };

  const formatStatus = (status: string) => status.replace('_', ' ');

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mottainai</h1>
        <p className={styles.subtitle}>Consider deeply before you acquire.</p>
      </header>

      <main>
        <section className={`${styles.addSection} ${!canAdd ? styles.limitReached : ''}`}>
          <form onSubmit={handleAddItem} className={styles.addForm}>
            <input
              type="text"
              placeholder="What do you desire to buy?"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              disabled={!canAdd}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={!canAdd}>
              Reflect
            </button>
            {!canAdd && (
              <span className={styles.limitWarning}>
                You have reached your limit of {DAILY_ITEM_LIMIT} reflections for today. Rest and return tomorrow.
              </span>
            )}
          </form>
        </section>

        <section className={styles.itemsList}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Your list is empty. What is on your mind?</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className={`${styles.itemCard} ${item.status === 'pending' ? styles.interactive : ''}`}
                onClick={() => {
                  if (item.status === 'pending') setSelectedItem(item);
                }}
                role={item.status === 'pending' ? 'button' : 'article'}
                tabIndex={item.status === 'pending' ? 0 : undefined}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.name}</div>
                  {item.decisionReason && (
                    <div className={styles.itemReason}>"{item.decisionReason}"</div>
                  )}
                </div>
                <div className={`${styles.itemLabel} ${styles[`status-${item.status}`]}`}>
                  {formatStatus(item.status)}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {selectedItem && (
        <ChatModal 
          item={selectedItem}
          currency={currency}
          onClose={() => setSelectedItem(null)} 
          onComplete={handleItemUpdate} 
        />
      )}

      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()}{" "}
          <a
            href="https://sreekeshokky.in"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Sreekesh Okky
          </a>
        </p>
      </footer>
    </div>
  );
}
