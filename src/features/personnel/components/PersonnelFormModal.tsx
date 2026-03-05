import { useState, type FormEvent } from 'react';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import { ROLES } from '../../../shared/constants/roles';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import { Modal } from '../../../shared/components/Modal';
import type { PersonnelItem, PersonnelCreatePayload, PersonnelUpdatePayload } from '../api/personnel.api';

interface Props {
    editItem: PersonnelItem | null;
    onSubmit: (payload: PersonnelCreatePayload | PersonnelUpdatePayload) => void;
    onClose: () => void;
    isPending: boolean;
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

export function PersonnelFormModal({ editItem, onSubmit, onClose, isPending }: Props) {
    const isEdit = !!editItem;

    const [firstName, setFirstName] = useState(editItem?.firstName ?? '');
    const [lastName, setLastName] = useState(editItem?.lastName ?? '');
    const [email, setEmail] = useState(editItem?.email ?? '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(editItem?.role ?? '');
    const [department, setDepartment] = useState(editItem?.department ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate(): boolean {
        const errs: Record<string, string> = {};

        if (!firstName.trim()) errs.firstName = 'Ad zorunludur';
        if (!lastName.trim()) errs.lastName = 'Soyad zorunludur';

        if (!email.trim()) {
            errs.email = 'E-posta zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'Geçerli bir e-posta girin';
        }

        if (!isEdit) {
            if (!password) {
                errs.password = 'Şifre zorunludur';
            } else if (password.length < 8) {
                errs.password = 'Minimum 8 karakter';
            } else if (!/[A-Z]/.test(password)) {
                errs.password = 'En az 1 büyük harf olmalı';
            } else if (!/\d/.test(password)) {
                errs.password = 'En az 1 rakam olmalı';
            }
        }

        if (!role) errs.role = 'Rol seçilmelidir';

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        if (isEdit) {
            const payload: PersonnelUpdatePayload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                role,
                department: department || undefined,
            };
            if (password) {
                (payload as Record<string, unknown>).password = password;
            }
            onSubmit(payload);
        } else {
            const payload: PersonnelCreatePayload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                role,
                department: department || undefined,
            };
            onSubmit(payload);
        }
    }

    return (
        <Modal
            title={isEdit ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
            onClose={onClose}
            width={480}
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {/* Ad */}
                    <div>
                        <label style={labelStyle}>Ad *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.firstName ? '#DC2626' : '#D1D5DB' }}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Ad"
                        />
                        {errors.firstName && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.firstName}</p>}
                    </div>
                    {/* Soyad */}
                    <div>
                        <label style={labelStyle}>Soyad *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.lastName ? '#DC2626' : '#D1D5DB' }}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Soyad"
                        />
                        {errors.lastName && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.lastName}</p>}
                    </div>
                </div>

                {/* E-posta */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>E-posta *</label>
                    <input
                        type="email"
                        style={{ ...inputStyle, borderColor: errors.email ? '#DC2626' : '#D1D5DB' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@trivexa.com"
                    />
                    {errors.email && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.email}</p>}
                </div>

                {/* Şifre */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>
                        Şifre {isEdit ? '(boş bırakılırsa değişmez)' : '*'}
                    </label>
                    <input
                        type="password"
                        style={{ ...inputStyle, borderColor: errors.password ? '#DC2626' : '#D1D5DB' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 karakter, 1 büyük harf, 1 rakam"
                    />
                    {errors.password && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.password}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                    {/* Rol */}
                    <div>
                        <label style={labelStyle}>Rol *</label>
                        <select
                            style={{ ...inputStyle, borderColor: errors.role ? '#DC2626' : '#D1D5DB', cursor: 'pointer' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Seçin...</option>
                            {Object.entries(ROLES).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {ROLE_LABELS[key] ?? key}
                                </option>
                            ))}
                        </select>
                        {errors.role && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.role}</p>}
                    </div>
                    {/* Departman */}
                    <div>
                        <label style={labelStyle}>Departman</label>
                        <select
                            style={{ ...inputStyle, cursor: 'pointer' }}
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                        >
                            <option value="">Seçin...</option>
                            {Object.entries(DEPARTMENTS).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {DEPARTMENT_LABELS[key] ?? key}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Butonlar */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '9px 20px', borderRadius: 8, border: '1px solid #E5E7EB',
                            backgroundColor: '#fff', color: '#374151', fontSize: 13,
                            fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        style={{
                            padding: '9px 20px', borderRadius: 8, border: 'none',
                            backgroundColor: '#DC2626', color: '#fff', fontSize: 13,
                            fontWeight: 600, cursor: isPending ? 'default' : 'pointer',
                            opacity: isPending ? 0.6 : 1,
                        }}
                    >
                        {isPending ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
