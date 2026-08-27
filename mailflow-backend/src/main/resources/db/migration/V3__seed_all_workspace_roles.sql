INSERT INTO roles (id, name, description)
VALUES 
    (gen_random_uuid(), 'ROLE_OWNER', 'Toàn quyền kiểm soát cao nhất với workspace, tài chính và cấu hình nhạy cảm.'),
    (gen_random_uuid(), 'ROLE_MARKETING_MANAGER', 'Quản lý toàn bộ chiến dịch, phê duyệt gửi email, quản lý danh bạ và xem báo cáo.'),
    (gen_random_uuid(), 'ROLE_CAMPAIGN_EDITOR', 'Soạn thảo nội dung email, thiết kế mẫu templates và tạo bản nháp chiến dịch.'),
    (gen_random_uuid(), 'ROLE_CONTACT_MANAGER', 'Nhập/xuất danh bạ, phân đoạn khách hàng và quản lý danh sách người nhận.'),
    (gen_random_uuid(), 'ROLE_ANALYST', 'Xem số liệu phân tích, xuất báo cáo hiệu suất và tỷ lệ chuyển đổi.'),
    (gen_random_uuid(), 'ROLE_BILLING_MANAGER', 'Quản lý các khoản thanh toán, nâng cấp gói cước và theo dõi hóa đơn.'),
    (gen_random_uuid(), 'ROLE_VIEWER', 'Chỉ xem dữ liệu, báo cáo cơ bản, không có quyền chỉnh sửa hoặc gửi email.')
ON CONFLICT DO NOTHING;
