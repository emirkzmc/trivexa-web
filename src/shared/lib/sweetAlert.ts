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
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        reverseButtons: true,
        focusCancel: true,
    });

    return result.isConfirmed;
}
