import Swal from 'sweetalert2';

interface ConfirmDialogOptions {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: 'warning' | 'question' | 'info' | 'error' | 'success';
}

export async function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
    const result = await Swal.fire({
        title: options.title,
        text: options.text,
        icon: options.icon ?? 'warning',
        showCancelButton: true,
        confirmButtonText: options.confirmText ?? 'Evet',
        cancelButtonText: options.cancelText ?? 'Vazgec',
        confirmButtonColor: 'var(--role-accent-600)',
        cancelButtonColor: '#6B7280',
        reverseButtons: true,
        focusCancel: true,
    });

    return result.isConfirmed;
}

interface ConfirmDialogCheckboxOptions extends ConfirmDialogOptions {
    checkboxLabel: string;
}

export async function showConfirmDialogWithCheckbox(
    options: ConfirmDialogCheckboxOptions,
): Promise<boolean> {
    const result = await Swal.fire({
        title: options.title,
        text: options.text,
        icon: options.icon ?? 'warning',
        showCancelButton: true,
        confirmButtonText: options.confirmText ?? 'Evet',
        cancelButtonText: options.cancelText ?? 'Vazgec',
        confirmButtonColor: 'var(--role-accent-600)',
        cancelButtonColor: '#6B7280',
        reverseButtons: true,
        focusCancel: true,
        input: 'checkbox',
        inputPlaceholder: options.checkboxLabel,
        inputValidator: (value) => {
            if (!value) {
                return 'Onay kutusunu isaretlemeniz gerekiyor.';
            }
            return null;
        },
    });

    return result.isConfirmed && result.value === 1;
}
