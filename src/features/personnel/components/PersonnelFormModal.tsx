import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../../../shared/components/Modal';
import type { PersonnelItem, PersonnelCreatePayload, PersonnelUpdatePayload } from '../api/personnel.api';

interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    editItem: PersonnelItem | null;
    onSubmit: (payload: PersonnelCreatePayload | PersonnelUpdatePayload) => void;
    onClose: () => void;
    isPending: boolean;
    roleOptions: SelectOption[];
    departmentOptions: SelectOption[];
    departmentModulesByDepartment: Record<string, SelectOption[]>;
    rolesLoading?: boolean;
    departmentsLoading?: boolean;
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

export function PersonnelFormModal({
    editItem,
    onSubmit,
    onClose,
    isPending,
    roleOptions,
    departmentOptions,
    departmentModulesByDepartment,
    rolesLoading = false,
    departmentsLoading = false,
}: Props) {
    const isEdit = !!editItem;

    const [firstName, setFirstName] = useState(editItem?.firstName ?? '');
    const [lastName, setLastName] = useState(editItem?.lastName ?? '');
    const [email, setEmail] = useState(editItem?.email ?? '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(editItem?.role ?? '');
    const [department, setDepartment] = useState(editItem?.department ?? '');
    const [subDepartmentId, setSubDepartmentId] = useState(editItem?.subDepartmentId ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resolvedRoleOptions = useMemo(() => {
        if (!role || roleOptions.some((option) => option.value === role)) {
            return roleOptions;
        }
        return [...roleOptions, { value: role, label: role }];
    }, [role, roleOptions]);

    const resolvedDepartmentOptions = useMemo(() => {
        if (!department || departmentOptions.some((option) => option.value === department)) {
            return departmentOptions;
        }
        return [...departmentOptions, { value: department, label: department }];
    }, [department, departmentOptions]);

    const resolvedSubDepartmentOptions = useMemo(() => {
        const options = departmentModulesByDepartment[department] ?? [];
        if (!subDepartmentId || options.some((option) => option.value === subDepartmentId)) {
            return options;
        }

        const fallbackLabel = editItem?.subDepartmentName || subDepartmentId;
        return [...options, { value: subDepartmentId, label: fallbackLabel }];
    }, [departmentModulesByDepartment, department, subDepartmentId, editItem?.subDepartmentName]);

    function validate(): boolean {
        const errs: Record<string, string> = {};

        if (!firstName.trim()) errs.firstName = 'Ad zorunludur';
        if (!lastName.trim()) errs.lastName = 'Soyad zorunludur';

        if (!email.trim()) {
            errs.email = 'E-posta zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'Gecerli bir e-posta girin';
        }

        if (!isEdit) {
            if (!password) {
                errs.password = 'Sifre zorunludur';
            } else if (password.length < 8) {
                errs.password = 'Minimum 8 karakter';
            } else if (!/[A-Z]/.test(password)) {
                errs.password = 'En az 1 buyuk harf olmali';
            } else if (!/\d/.test(password)) {
                errs.password = 'En az 1 rakam olmali';
            }
        }

        if (!role) errs.role = 'Rol secilmelidir';

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
                subDepartmentId: subDepartmentId || undefined,
            };
            if (password) {
                (payload as Record<string, unknown>).password = password;
            }
            onSubmit(payload);
            return;
        }

        const payload: PersonnelCreatePayload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            role,
            department: department || undefined,
            subDepartmentId: subDepartmentId || undefined,
        };
        onSubmit(payload);
    }

    return (
        <Modal
            title={isEdit ? 'Personel Duzenle' : 'Yeni Personel Ekle'}
            onClose={onClose}
            width={560}
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={labelStyle}>Ad *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.firstName ? 'var(--role-accent-600)' : '#D1D5DB' }}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Ad"
                        />
                        {errors.firstName && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.firstName}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Soyad *</label>
                        <input
                            style={{ ...inputStyle, borderColor: errors.lastName ? 'var(--role-accent-600)' : '#D1D5DB' }}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Soyad"
                        />
                        {errors.lastName && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.lastName}</p>}
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>E-posta *</label>
                    <input
                        type="email"
                        style={{ ...inputStyle, borderColor: errors.email ? 'var(--role-accent-600)' : '#D1D5DB' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@trivexa.com"
                    />
                    {errors.email && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>
                        Sifre {isEdit ? '(bos birakilirsa degismez)' : '*'}
                    </label>
                    <input
                        type="password"
                        style={{ ...inputStyle, borderColor: errors.password ? 'var(--role-accent-600)' : '#D1D5DB' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 karakter, 1 buyuk harf, 1 rakam"
                    />
                    {errors.password && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.password}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                    <div>
                        <label style={labelStyle}>Rol *</label>
                        <select
                            style={{ ...inputStyle, borderColor: errors.role ? 'var(--role-accent-600)' : '#D1D5DB', cursor: 'pointer' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={rolesLoading}
                        >
                            <option value="">Secin...</option>
                            {resolvedRoleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.role && <p style={{ color: 'var(--role-accent-600)', fontSize: 11, margin: '4px 0 0' }}>{errors.role}</p>}
                    </div>

                    <div>
                        <label style={labelStyle}>Departman</label>
                        <select
                            style={{ ...inputStyle, cursor: 'pointer' }}
                            value={department}
                            onChange={(e) => {
                                setDepartment(e.target.value);
                                setSubDepartmentId('');
                            }}
                            disabled={departmentsLoading}
                        >
                            <option value="">Secin...</option>
                            {resolvedDepartmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Alt Departman</label>
                        <select
                            style={{
                                ...inputStyle,
                                borderColor: errors.subDepartmentId ? '#DC2626' : '#D1D5DB',
                                cursor: 'pointer',
                            }}
                            value={subDepartmentId}
                            onChange={(e) => setSubDepartmentId(e.target.value)}
                            disabled={!department || departmentsLoading}
                        >
                            <option value="">
                                {department
                                    ? resolvedSubDepartmentOptions.length
                                        ? 'Secin...'
                                        : 'Alt departman yok'
                                    : 'Once departman secin'}
                            </option>
                            {resolvedSubDepartmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.subDepartmentId && (
                            <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>
                                {errors.subDepartmentId}
                            </p>
                        )}
                    </div>
                </div>

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
                        Iptal
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        style={{
                            padding: '9px 20px', borderRadius: 8, border: 'none',
                            backgroundColor: 'var(--role-accent-600)', color: '#fff', fontSize: 13,
                            fontWeight: 600, cursor: isPending ? 'default' : 'pointer',
                            opacity: isPending ? 0.6 : 1,
                        }}
                    >
                        {isPending ? 'Kaydediliyor...' : isEdit ? 'Guncelle' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
