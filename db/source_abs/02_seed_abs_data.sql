-- ============================================================
-- Тестовые данные для имитации АБС банка
-- Дата отчёта: 2025-12-01 (используется как базовая)
-- ============================================================

-- ============================================================
-- Курсы валют (примерные, близкие к реальным)
-- ============================================================
INSERT INTO exchange_rates (currency_code, rate_date, rate_to_rub) VALUES
    ('RUB', '2025-12-01', 1.000000),
    ('USD', '2025-12-01', 89.250000),
    ('EUR', '2025-12-01', 96.400000),
    ('CNY', '2025-12-01', 12.150000)
ON CONFLICT (currency_code, rate_date) DO NOTHING;


-- ============================================================
-- Контрагенты
-- ============================================================
INSERT INTO counterparties (code, full_name, short_name, inn, client_type) VALUES
    ('SBER',    'ПАО Сбербанк',                  'Сбербанк',   '7707083893', 'bank'),
    ('VTB',     'Банк ВТБ (ПАО)',                'ВТБ',        '7702070139', 'bank'),
    ('ALFA',    'АО "Альфа-Банк"',               'Альфа-Банк', '7728168971', 'bank'),
    ('GAZP',    'ПАО "Газпром"',                 'Газпром',    '7736050003', 'corporate'),
    ('LKOH',    'ПАО "ЛУКОЙЛ"',                  'ЛУКОЙЛ',     '7708004767', 'corporate'),
    ('ROSNFT',  'ПАО "НК "Роснефть"',            'Роснефть',   '7706107510', 'corporate'),
    ('CORP001', 'ООО "ТехноСтрой"',              'ТехноСтрой', '9701234567', 'corporate'),
    ('CORP002', 'АО "АгроПром"',                 'АгроПром',   '5032145678', 'corporate'),
    ('PHYS001', 'Физические лица (агрегат)',      'Физлица',    NULL,         'individual'),
    ('CBR',     'Центральный банк РФ',            'ЦБ РФ',      '7702235133', 'cbr')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- АКТИВЫ: Кредиты корпоративные
-- ============================================================
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('KK-2024-001', (SELECT id FROM counterparties WHERE code='GAZP'),   'CREDIT_CORPORATE', 500000000.00, 'RUB', 12.50, '2024-03-15', '2026-03-15', 'active', '45206810100000000001'),
    ('KK-2024-002', (SELECT id FROM counterparties WHERE code='LKOH'),   'CREDIT_CORPORATE', 750000000.00, 'RUB', 11.75, '2024-06-01', '2027-06-01', 'active', '45206810100000000002'),
    ('KK-2024-003', (SELECT id FROM counterparties WHERE code='ROSNFT'), 'CREDIT_CORPORATE', 300000000.00, 'RUB', 13.00, '2024-09-10', '2025-12-10', 'active', '45206810100000000003'),
    ('KK-2024-004', (SELECT id FROM counterparties WHERE code='CORP001'),'CREDIT_CORPORATE', 120000000.00, 'RUB', 14.25, '2024-11-01', '2026-05-01', 'active', '45206810100000000004'),
    ('KK-2024-005', (SELECT id FROM counterparties WHERE code='CORP002'),'CREDIT_CORPORATE',  80000000.00, 'RUB', 14.75, '2024-10-20', '2025-12-20', 'active', '45206810100000000005'),
    ('KK-2024-006', (SELECT id FROM counterparties WHERE code='CORP001'),'CREDIT_CORPORATE', 250000000.00, 'USD', 7.50,  '2024-04-01', '2026-04-01', 'active', '45206840100000000006');

-- Ипотечные кредиты (физлица)
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('IP-2023-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'CREDIT_MORTGAGE', 450000000.00, 'RUB', 8.50,  '2023-01-15', '2038-01-15', 'active', '45507810100000000001'),
    ('IP-2023-002', (SELECT id FROM counterparties WHERE code='PHYS001'), 'CREDIT_MORTGAGE', 320000000.00, 'RUB', 9.00,  '2023-06-20', '2040-06-20', 'active', '45507810100000000002'),
    ('IP-2024-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'CREDIT_MORTGAGE', 180000000.00, 'RUB', 8.75,  '2024-02-10', '2039-02-10', 'active', '45507810100000000003');

-- Розничные кредиты
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('KR-2024-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'CREDIT_RETAIL', 250000000.00, 'RUB', 19.50, '2024-01-01', '2026-01-01', 'active', '45505810100000000001'),
    ('KR-2024-002', (SELECT id FROM counterparties WHERE code='PHYS001'), 'CREDIT_RETAIL', 180000000.00, 'RUB', 18.75, '2024-07-01', '2026-07-01', 'active', '45505810100000000002');


-- ============================================================
-- АКТИВЫ: МБК размещённые
-- ============================================================
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('MBK-P-001', (SELECT id FROM counterparties WHERE code='SBER'), 'IBC_PLACED', 200000000.00, 'RUB', 15.50, '2025-11-25', '2025-12-02', 'active', '32001810100000000001'),
    ('MBK-P-002', (SELECT id FROM counterparties WHERE code='VTB'),  'IBC_PLACED', 150000000.00, 'RUB', 15.25, '2025-11-28', '2025-12-05', 'active', '32001810100000000002'),
    ('MBK-P-003', (SELECT id FROM counterparties WHERE code='ALFA'), 'IBC_PLACED', 100000000.00, 'RUB', 15.75, '2025-11-01', '2025-12-30', 'active', '32001810100000000003');


-- ============================================================
-- АКТИВЫ: Ценные бумаги
-- ============================================================
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('OFZ-001', (SELECT id FROM counterparties WHERE code='CBR'), 'SECURITIES_GOVT', 1000000000.00, 'RUB', 10.50, '2022-06-15', '2027-06-15', 'active', '50104810100000000001'),
    ('OFZ-002', (SELECT id FROM counterparties WHERE code='CBR'), 'SECURITIES_GOVT',  500000000.00, 'RUB', 11.00, '2023-01-20', '2026-01-20', 'active', '50104810100000000002'),
    ('CORP-BND-001', (SELECT id FROM counterparties WHERE code='GAZP'), 'SECURITIES_CORP', 300000000.00, 'RUB', 12.25, '2023-09-01', '2026-09-01', 'active', '50104810100000000003');


-- ============================================================
-- АКТИВЫ: Депозит в ЦБ / касса (до востребования)
-- ============================================================
INSERT INTO contracts_assets (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('CBR-DEP-001', (SELECT id FROM counterparties WHERE code='CBR'), 'CBR_DEPOSIT', 800000000.00, 'RUB', 16.00, '2025-11-30', '2025-12-01', 'active', '31901810100000000001'),
    ('CASH-001',    (SELECT id FROM counterparties WHERE code='CBR'), 'CASH',         50000000.00, 'RUB', 0.00,  '2025-12-01', NULL,         'active', '20202810100000000001');


-- ============================================================
-- ОБЯЗАТЕЛЬСТВА: Депозиты физических лиц
-- ============================================================
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('DP-F-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'DEPOSIT_RETAIL', 1200000000.00, 'RUB', 14.00, '2025-06-01', '2026-06-01', 'active', '42301810100000000001'),
    ('DP-F-002', (SELECT id FROM counterparties WHERE code='PHYS001'), 'DEPOSIT_RETAIL',  800000000.00, 'RUB', 13.50, '2025-09-01', '2026-03-01', 'active', '42301810100000000002'),
    ('DP-F-003', (SELECT id FROM counterparties WHERE code='PHYS001'), 'DEPOSIT_RETAIL',  350000000.00, 'RUB', 15.00, '2025-11-01', '2026-02-01', 'active', '42301810100000000003'),
    ('DP-F-004', (SELECT id FROM counterparties WHERE code='PHYS001'), 'DEPOSIT_RETAIL',  200000000.00, 'USD', 4.00,  '2025-07-15', '2026-07-15', 'active', '42301840100000000004');

-- Счета до востребования (физлица)
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('DDO-F-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'DEPOSIT_DEMAND', 450000000.00, 'RUB', 1.00, '2020-01-01', NULL, 'active', '42301810200000000001');


-- ============================================================
-- ОБЯЗАТЕЛЬСТВА: Депозиты корпоративные
-- ============================================================
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('DP-K-001', (SELECT id FROM counterparties WHERE code='GAZP'),  'DEPOSIT_CORPORATE', 600000000.00, 'RUB', 13.75, '2025-10-01', '2026-04-01', 'active', '42101810100000000001'),
    ('DP-K-002', (SELECT id FROM counterparties WHERE code='LKOH'),  'DEPOSIT_CORPORATE', 400000000.00, 'RUB', 14.00, '2025-08-15', '2026-02-15', 'active', '42101810100000000002'),
    ('DP-K-003', (SELECT id FROM counterparties WHERE code='CORP001'),'DEPOSIT_CORPORATE',  80000000.00, 'RUB', 13.00, '2025-11-10', '2026-01-10', 'active', '42101810100000000003');

-- Счета до востребования (корпоративные)
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('DDO-K-001', (SELECT id FROM counterparties WHERE code='GAZP'),  'DEPOSIT_DEMAND', 250000000.00, 'RUB', 0.10, '2019-05-01', NULL, 'active', '40702810100000000001'),
    ('DDO-K-002', (SELECT id FROM counterparties WHERE code='LKOH'),  'DEPOSIT_DEMAND', 180000000.00, 'RUB', 0.10, '2021-03-01', NULL, 'active', '40702810100000000002'),
    ('DDO-K-003', (SELECT id FROM counterparties WHERE code='CORP002'),'DEPOSIT_DEMAND',  60000000.00, 'RUB', 0.10, '2022-11-01', NULL, 'active', '40702810100000000003');


-- ============================================================
-- ОБЯЗАТЕЛЬСТВА: МБК привлечённые
-- ============================================================
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('MBK-A-001', (SELECT id FROM counterparties WHERE code='SBER'), 'IBC_ATTRACTED', 300000000.00, 'RUB', 15.00, '2025-11-20', '2025-12-04', 'active', '31302810100000000001'),
    ('MBK-A-002', (SELECT id FROM counterparties WHERE code='VTB'),  'IBC_ATTRACTED', 500000000.00, 'RUB', 15.25, '2025-10-01', '2025-12-20', 'active', '31302810100000000002'),
    ('MBK-A-003', (SELECT id FROM counterparties WHERE code='ALFA'), 'IBC_ATTRACTED', 200000000.00, 'RUB', 15.50, '2025-11-01', '2026-01-31', 'active', '31302810100000000003');


-- ============================================================
-- ОБЯЗАТЕЛЬСТВА: Выпущенные облигации
-- ============================================================
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('BOND-001', (SELECT id FROM counterparties WHERE code='PHYS001'), 'BOND_ISSUED', 2000000000.00, 'RUB', 12.50, '2023-03-01', '2026-03-01', 'active', '52001810100000000001'),
    ('BOND-002', (SELECT id FROM counterparties WHERE code='CORP001'), 'BOND_ISSUED',  500000000.00, 'RUB', 13.00, '2024-01-15', '2027-01-15', 'active', '52001810100000000002');


-- ============================================================
-- ОБЯЗАТЕЛЬСТВА: Субординированный займ
-- ============================================================
INSERT INTO contracts_liabilities (contract_number, counterparty_id, product_type, amount, currency, interest_rate, issue_date, maturity_date, status, account_number) VALUES
    ('SUB-001', (SELECT id FROM counterparties WHERE code='CORP001'), 'SUBORD_LOAN', 1000000000.00, 'RUB', 10.00, '2020-07-01', '2030-07-01', 'active', '31308810100000000001');


-- ============================================================
-- Остатки на корреспондентских счетах
-- ============================================================
INSERT INTO account_balances (account_number, counterparty_id, account_type, balance, currency, balance_date) VALUES
    ('30101810100000000001', (SELECT id FROM counterparties WHERE code='CBR'),  'correspondent', 1500000000.00, 'RUB', '2025-12-01'),
    ('30109810100000000002', (SELECT id FROM counterparties WHERE code='SBER'), 'correspondent',  200000000.00, 'RUB', '2025-12-01'),
    ('30109810100000000003', (SELECT id FROM counterparties WHERE code='VTB'),  'correspondent',  150000000.00, 'RUB', '2025-12-01'),
    ('30109840100000000004', (SELECT id FROM counterparties WHERE code='ALFA'), 'correspondent',    5000000.00, 'USD', '2025-12-01');
