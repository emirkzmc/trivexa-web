import { X } from 'lucide-react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
}

export function Modal({ title, onClose, children, width = 480 }: ModalProps) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff', borderRadius: 14, width,
                    maxHeight: '90vh', overflowY: 'auto', padding: '24px 28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    fontFamily: "'Poppins', system-ui, sans-serif",
                }}
            >
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 20,
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 4, borderRadius: 6, display: 'flex',
                        }}
                    >
                        <X size={18} color="#6B7280" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
