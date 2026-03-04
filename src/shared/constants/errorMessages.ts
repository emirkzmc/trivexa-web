/**
 * Merkezi hata mesajları.
 * Backend'den dönen hata kodları burada kullanıcı dostu mesajlara çevrilir.
 */
export const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'E-posta veya şifre hatalı',
    ACCOUNT_DEACTIVATED: 'Hesabınız devre dışı bırakılmış',
    TOKEN_EXPIRED: 'Oturumunuz sona erdi, lütfen tekrar giriş yapın',
    TOKEN_INVALID: 'Geçersiz oturum, lütfen tekrar giriş yapın',
    FORBIDDEN: 'Bu işlem için yetkiniz bulunmamaktadır',
    NOT_FOUND: 'İstenen kaynak bulunamadı',
    VALIDATION_ERROR: 'Girdiğiniz bilgileri kontrol edin',
    RATE_LIMITED: 'Çok fazla istek gönderdiniz, lütfen biraz bekleyin',
    SERVER_ERROR: 'Sunucu hatası, lütfen tekrar deneyin',
    NETWORK_ERROR: 'Bağlantı hatası, internet bağlantınızı kontrol edin',
    UNKNOWN: 'Beklenmeyen bir hata oluştu',
} as const;

/**
 * Backend'den gelen hata response'u veya AxiosError'dan kullanıcı dostu mesaj çıkarır.
 */
export function resolveErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;

        // Axios response error
        if (err.response && typeof err.response === 'object') {
            const data = (err.response as Record<string, unknown>).data;
            if (typeof data === 'object' && data !== null) {
                const d = data as Record<string, unknown>;
                const code = d.errorCode ?? d.code;
                if (typeof code === 'string' && code in ERROR_MESSAGES) {
                    return ERROR_MESSAGES[code];
                }
                if (typeof d.message === 'string') return d.message;
            }
        }

        // Network / timeout error
        if (err.code === 'ERR_NETWORK') return ERROR_MESSAGES.NETWORK_ERROR;
        if (err.code === 'ECONNABORTED') return ERROR_MESSAGES.NETWORK_ERROR;
    }

    return ERROR_MESSAGES.UNKNOWN;
}
