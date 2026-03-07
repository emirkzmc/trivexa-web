import { useState, type FormEvent } from 'react';
import { Modal } from '../../../shared/components/Modal';
import type { ClientCreatePayload, ClientItem, ClientUpdatePayload } from '../api/clients.api';

interface ClientFormModalProps {
    editItem: ClientItem | null;
    isPending: boolean;
    onClose: () => void;
    onSubmit: (payload: ClientCreatePayload | ClientUpdatePayload) => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 13,
    outline: 'none',
    fontFamily: "'Poppins', system-ui, sans-serif",
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
};

export function ClientFormModal({
    editItem,
    isPending,
    onClose,
    onSubmit,
}: ClientFormModalProps) {
    const isEdit = !!editItem;
    const [companyName, setCompanyName] = useState(editItem?.companyName ?? '');
    const [contactPerson, setContactPerson] = useState(editItem?.contactPerson ?? '');
    const [email, setEmail] = useState(editItem?.email ?? '');
    const [phone, setPhone] = useState(editItem?.phone ?? '');
    const [address, setAddress] = useState(editItem?.address ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate(): boolean {
        const nextErrors: Record<string, string> = {};
        if (!companyName.trim()) {
            nextErrors.companyName = 'Sirket adi zorunludur';
        }
        if (!contactPerson.trim()) {
            nextErrors.contactPerson = 'Yetkili kisi zorunludur';
        }
        if (!email.trim()) {
            nextErrors.email = 'E-posta zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Gecerli bir e-posta girin';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!validate()) {
            return;
        }

        const payload: ClientCreatePayload = {
            companyName: companyName.trim(),
            contactPerson: contactPerson.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
        };

        onSubmit(payload);
    }

    return (
        <Modal
            title={isEdit ? 'Musteri Duzenle' : 'Yeni Musteri Ekle'}
            onClose={onClose}
            width={620}
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={labelStyle}>Sirket Adi *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.companyName ? 'var(--role-accent-600)' : '#D1D5DB' }}
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                            placeholder="Ornek Sirket A.S."
                        />
                        {errors.companyName && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.companyName}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Yetkili Kisi *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.contactPerson ? 'var(--role-accent-600)' : '#D1D5DB' }}
                            value={contactPerson}
                            onChange={(event) => setContactPerson(event.target.value)}
                            placeholder="Ad Soyad"
                        />
                        {errors.contactPerson && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.contactPerson}</p>}
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>E-posta *</label>
                    <input
                        type="email"
                        style={{ ...inputStyle, borderColor: errors.email ? 'var(--role-accent-600)' : '#D1D5DB' }}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="iletisim@sirket.com"
                    />
                    {errors.email && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.email}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                    <div>
                        <label style={labelStyle}>Telefon</label>
                        <input
                            style={inputStyle}
                            value={phone ?? ''}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+90 5xx xxx xx xx"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Adres</label>
                        <input
                            style={inputStyle}
                            value={address ?? ''}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Sehir, ilce, mahalle"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '9px 20px',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Iptal
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        style={{
                            padding: '9px 20px',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: 'var(--role-accent-600)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isPending ? 'default' : 'pointer',
                            opacity: isPending ? 0.7 : 1,
                        }}
                    >
                        {isPending ? 'Kaydediliyor...' : isEdit ? 'Guncelle' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
