-- ============================================================
-- Справочные данные: источники данных
-- ============================================================
INSERT INTO audit.datasource (name, source_type, connection_string, description) VALUES
    ('bank_abs_postgresql', 'postgresql',
     'postgresql://abs_user:abs_password@source_db:5432/bank_abs',
     'Основная банковская АБС (PostgreSQL, имитация)'),
    ('excel_assets', 'excel',
     NULL,
     'Excel-файлы с данными об активах'),
    ('excel_liabilities', 'excel',
     NULL,
     'Excel-файлы с данными об обязательствах')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- Справочник типов продуктов
-- ============================================================
INSERT INTO dwh.producttyperef (code, name, category, subcategory) VALUES
    -- АКТИВЫ
    ('CREDIT_CORPORATE',     'Кредит корпоративный',        'asset',     'кредит'),
    ('CREDIT_RETAIL',        'Кредит розничный',             'asset',     'кредит'),
    ('CREDIT_MORTGAGE',      'Ипотечный кредит',             'asset',     'кредит'),
    ('IBC_PLACED',           'МБК размещённый',              'asset',     'МБК'),
    ('SECURITIES_GOVT',      'Гос. ценные бумаги',           'asset',     'ценные бумаги'),
    ('SECURITIES_CORP',      'Корпоративные облигации',      'asset',     'ценные бумаги'),
    ('CASH',                 'Касса и корр. счета',          'asset',     'ликвидные активы'),
    ('CBR_DEPOSIT',          'Депозит в ЦБ РФ',              'asset',     'ликвидные активы'),
    -- ОБЯЗАТЕЛЬСТВА
    ('DEPOSIT_RETAIL',       'Депозит физических лиц',       'liability', 'депозит'),
    ('DEPOSIT_CORPORATE',    'Депозит корпоративный',        'liability', 'депозит'),
    ('DEPOSIT_DEMAND',       'Счёт до востребования',        'liability', 'депозит'),
    ('IBC_ATTRACTED',        'МБК привлечённый',             'liability', 'МБК'),
    ('BOND_ISSUED',          'Облигации выпущенные',         'liability', 'ценные бумаги'),
    ('SUBORD_LOAN',          'Субординированный займ',       'liability', 'займы')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- Справочник контрагентов — НЕ заполняется вручную.
-- Контрагенты синхронизируются из АБС при каждом запуске ETL:
--   ETLPipeline._run_postgres() → extractor.extract_counterparties()
--                               → loader.sync_counterparties()  (UPSERT)
-- Таблица dwh.counterpartyref остаётся пустой до первого запуска ETL.
-- ============================================================
