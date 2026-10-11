const http = require('http');

const loginData = JSON.stringify({ email: 'admin@trivexa.com', password: 'password123' });

const req = http.request({
    hostname: 'localhost',
    port: 3500,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const token = data.accessToken || data.data?.accessToken;
            if (!token) throw new Error('No token found: ' + body);

            http.get({
                hostname: 'localhost',
                port: 3500,
                path: '/api/v1/users',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            }, (res2) => {
                let body2 = '';
                res2.on('data', chunk => body2 += chunk);
                res2.on('end', () => {
                    console.log('USERS RESPONSE:', body2.substring(0, 500));
                });
            });
        } catch (e) { console.error('Error parsing login:', e.message); }
    });
});

req.write(loginData);
req.end();
