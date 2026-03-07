const nodemailer = require('nodemailer');
require('dns').setDefaultResultOrder('ipv4first');
// Tạo transporter một lần, dùng lại cho mỗi lần gửi
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    family: 4, // Ép dùng IPv4 — Render free tier không hỗ trợ IPv6
});

/**
 * Format tiền VND
 */
const formatVND = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('vi-VN') + ' đ';
};

/**
 * Format ngày giờ theo kiểu Việt Nam
 */
const formatDateTime = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
};

const formatTime = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Tạo HTML email báo cáo kết ca
 */
const buildShiftReportHTML = (data) => {
    const {
        shift_id,
        user_name,
        start_time,
        end_time,
        initial_float,
        total_cash_sales,
        total_transfer_sales,
        total_all_sales,
        expected_cash,
        actual_cash,
        difference,
        total_orders,
        total_completed_orders,
        total_items_sold,
        top_products,
        note
    } = data;

    // Tính thời gian làm việc
    const startMs = new Date(start_time).getTime();
    const endMs = new Date(end_time).getTime();
    const durationMs = endMs - startMs;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = `${hours} giờ ${minutes} phút`;

    // Top products HTML
    let topProductsHTML = '';
    if (top_products && top_products.length > 0) {
        topProductsHTML = top_products.map((p, i) => `
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px; text-align: center; font-weight: bold; color: ${i < 3 ? '#5D4037' : '#999'};">${i + 1}</td>
                <td style="padding: 10px;">${p.product_name}</td>
                <td style="padding: 10px; text-align: center;">${p.total_quantity}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${formatVND(p.total_revenue)}</td>
            </tr>
        `).join('');
    } else {
        topProductsHTML = `
            <tr><td colspan="4" style="padding: 20px; text-align: center; color: #999;">Không có dữ liệu món bán</td></tr>
        `;
    }

    // Difference color
    const diffColor = difference > 0 ? '#388E3C' : difference < 0 ? '#D32F2F' : '#333';
    const diffLabel = difference > 0 ? `+${formatVND(difference)} (Thừa)`
        : difference < 0 ? `${formatVND(difference)} (Thiếu)`
            : '0 đ (Khớp)';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- HEADER -->
            <tr>
                <td style="background: linear-gradient(135deg, #5D4037 0%, #8D6E63 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">☕ CoffeeTek POS</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">BÁO CÁO KẾT CA LÀM VIỆC</p>
                </td>
            </tr>

            <!-- THÔNG TIN CA -->
            <tr>
                <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAFA; border-radius: 12px; padding: 20px;">
                        <tr>
                            <td style="padding: 8px 20px;">
                                <span style="color: #888; font-size: 13px;">👤 Nhân viên</span><br>
                                <strong style="font-size: 16px; color: #333;">${user_name || 'Không xác định'}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 20px;">
                                <span style="color: #888; font-size: 13px;">🕐 Thời gian</span><br>
                                <strong style="color: #333;">${formatTime(start_time)} → ${formatTime(end_time)}</strong>
                                <span style="color: #5D4037; font-size: 12px; margin-left: 8px;">(${durationStr})</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 20px;">
                                <span style="color: #888; font-size: 13px;">📅 Ngày</span><br>
                                <strong style="color: #333;">${formatDateTime(start_time).split(',')[0] || formatDateTime(start_time)}</strong>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- TỔNG QUAN DOANH THU -->
            <tr>
                <td style="padding: 0 25px;">
                    <h3 style="color: #5D4037; border-bottom: 2px solid #5D4037; padding-bottom: 8px; margin-bottom: 15px;">
                        💰 TỔNG QUAN DOANH THU
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px; background: #E8F5E9; border-radius: 8px; text-align: center; width: 50%;">
                                <span style="color: #666; font-size: 12px;">Tổng doanh thu</span><br>
                                <strong style="font-size: 22px; color: #388E3C;">${formatVND(total_all_sales)}</strong>
                            </td>
                            <td style="width: 10px;"></td>
                            <td style="padding: 12px; background: #E3F2FD; border-radius: 8px; text-align: center; width: 50%;">
                                <span style="color: #666; font-size: 12px;">Tổng đơn hoàn thành</span><br>
                                <strong style="font-size: 22px; color: #1976D2;">${total_completed_orders || 0}</strong>
                            </td>
                        </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                        <tr>
                            <td style="padding: 10px 15px; background: #FFF3E0; border-radius: 8px;">
                                <table width="100%">
                                    <tr>
                                        <td style="color: #666;">Tiền mặt:</td>
                                        <td style="text-align: right; font-weight: bold;">${formatVND(total_cash_sales)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666;">Chuyển khoản:</td>
                                        <td style="text-align: right; font-weight: bold;">${formatVND(total_transfer_sales)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666;">Tổng số món bán:</td>
                                        <td style="text-align: right; font-weight: bold; color: #5D4037;">${total_items_sold || 0} món</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- KIỂM KÊ TIỀN MẶT -->
            <tr>
                <td style="padding: 20px 25px 0;">
                    <h3 style="color: #5D4037; border-bottom: 2px solid #5D4037; padding-bottom: 8px; margin-bottom: 15px;">
                        🏧 KIỂM KÊ TIỀN MẶT
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAFA; border-radius: 8px; padding: 15px;">
                        <tr>
                            <td style="padding: 6px 15px; color: #666;">Tiền đầu ca:</td>
                            <td style="padding: 6px 15px; text-align: right; font-weight: bold;">${formatVND(initial_float)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 15px; color: #666;">Doanh thu TM trong ca:</td>
                            <td style="padding: 6px 15px; text-align: right; font-weight: bold; color: #388E3C;">+${formatVND(total_cash_sales)}</td>
                        </tr>
                        <tr style="border-top: 1px solid #ddd;">
                            <td style="padding: 6px 15px; color: #666;">Hệ thống tính (kỳ vọng):</td>
                            <td style="padding: 6px 15px; text-align: right; font-weight: bold;">${formatVND(expected_cash)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 15px; color: #666;">Thực tế trong két:</td>
                            <td style="padding: 6px 15px; text-align: right; font-weight: bold;">${formatVND(actual_cash)}</td>
                        </tr>
                        <tr style="background: ${difference >= 0 ? '#E8F5E9' : '#FFEBEE'}; border-radius: 6px;">
                            <td style="padding: 10px 15px; font-weight: bold;">Chênh lệch:</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: bold; font-size: 16px; color: ${diffColor};">${diffLabel}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- TOP MÓN BÁN CHẠY -->
            <tr>
                <td style="padding: 20px 25px 0;">
                    <h3 style="color: #5D4037; border-bottom: 2px solid #5D4037; padding-bottom: 8px; margin-bottom: 15px;">
                        🏆 TOP MÓN BÁN CHẠY TRONG CA
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <tr style="background: #5D4037; color: white;">
                            <th style="padding: 10px; text-align: center; width: 40px;">#</th>
                            <th style="padding: 10px; text-align: left;">Tên món</th>
                            <th style="padding: 10px; text-align: center;">SL</th>
                            <th style="padding: 10px; text-align: right;">Doanh thu</th>
                        </tr>
                        ${topProductsHTML}
                    </table>
                </td>
            </tr>

            <!-- GHI CHÚ -->
            ${note ? `
            <tr>
                <td style="padding: 20px 25px 0;">
                    <div style="background: #FFF8E1; border-left: 4px solid #FFC107; padding: 12px 15px; border-radius: 0 8px 8px 0;">
                        <strong style="color: #F57F17;">📝 Ghi chú:</strong>
                        <p style="margin: 5px 0 0; color: #666;">${note}</p>
                    </div>
                </td>
            </tr>
            ` : ''}

            <!-- FOOTER -->
            <tr>
                <td style="padding: 25px; text-align: center; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        Email tự động từ hệ thống CoffeeTek POS<br>
                        Thời gian gửi: ${formatDateTime(new Date())}
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * Gửi email báo cáo kết ca
 * @param {Object} reportData - Dữ liệu báo cáo ca
 * @param {string} recipientEmail - Email người nhận (nếu không truyền, dùng .env)
 * @returns {Promise<boolean>} - true nếu gửi thành công
 */
const sendShiftReport = async (reportData, recipientEmail) => {
    try {
        // Kiểm tra config
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
            console.log('[Email] SMTP chưa được cấu hình. Bỏ qua gửi email.');
            return false;
        }

        const to = recipientEmail || process.env.REPORT_EMAIL_TO;
        if (!to || to === 'manager@gmail.com') {
            console.log('[Email] Chưa cấu hình email nhận. Bỏ qua gửi email.');
            return false;
        }

        const userName = reportData.user_name || 'Nhân viên';
        const endTime = formatDateTime(reportData.end_time);

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: to,
            subject: `☕ Báo cáo kết ca - ${userName} - ${endTime}`,
            html: buildShiftReportHTML(reportData),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Gửi thành công đến ${to}: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('[Email] Lỗi gửi email:', error.message);
        // Không throw error để không ảnh hưởng flow đóng ca
        return false;
    }
};

module.exports = { sendShiftReport, formatVND, formatDateTime };
