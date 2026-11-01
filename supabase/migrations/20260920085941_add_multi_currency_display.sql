-- ============================================
-- CURRENCIES
-- ============================================
create table currencies (
  code text primary key,              -- ISO 4217, e.g. 'INR', 'USD', 'EUR', 'JPY'
  name text not null,
  symbol text not null,               -- e.g. '₹', '$', '€'
  decimal_digits int not null default 2,  -- JPY = 0, most others = 2
  is_active boolean default true
);

insert into currencies (code, name, symbol, decimal_digits) values
  ('INR', 'Indian Rupee', '₹', 2),
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('JPY', 'Japanese Yen', '¥', 0);

-- ============================================
-- STORE SETTINGS (single row — the base/charging currency)
-- ============================================
create table store_settings (
  id boolean primary key default true check (id = true),  -- enforces exactly one row
  base_currency_code text references currencies(code) not null default 'INR'
);

insert into store_settings (id, base_currency_code) values (true, 'INR');

-- ============================================
-- EXCHANGE RATES (to base currency)
-- ============================================
create table exchange_rates (
  currency_code text references currencies(code) not null,
  rate_to_base numeric(12,6) not null check (rate_to_base > 0),
  updated_at timestamptz default now(),
  primary key (currency_code)
);

-- base currency always has rate 1 to itself
insert into exchange_rates (currency_code, rate_to_base) values ('INR', 1.0);

-- ============================================
-- CONVERSION FUNCTION (for display only, not charging)
-- ============================================
create or replace function convert_price(p_amount numeric, p_target_currency text)
returns numeric
language plpgsql
stable
as $$
declare
  v_rate numeric;
  v_digits int;
begin
  select rate_to_base into v_rate from exchange_rates where currency_code = p_target_currency;
  select decimal_digits into v_digits from currencies where code = p_target_currency;

  if v_rate is null then
    return p_amount;  -- fallback: unknown currency, return base amount unconverted
  end if;

  return round(p_amount * v_rate, coalesce(v_digits, 2));
end;
$$;

-- ============================================
-- ORDERS: snapshot what currency/amount was SHOWN at checkout
-- (real charge is always orders.total, in base currency)
-- ============================================
alter table orders
  add column display_currency_code text references currencies(code),
  add column display_total numeric(12,2);

-- ============================================
-- RLS
-- ============================================
alter table currencies enable row level security;
alter table exchange_rates enable row level security;
alter table store_settings enable row level security;

create policy "Anyone can view currencies" on currencies for select using (true);
create policy "Admins manage currencies" on currencies for insert with check (is_admin());
create policy "Admins update currencies" on currencies for update using (is_admin());

create policy "Anyone can view exchange rates" on exchange_rates for select using (true);
create policy "Admins manage exchange rates" on exchange_rates for insert with check (is_admin());
create policy "Admins update exchange rates" on exchange_rates for update using (is_admin());

create policy "Anyone can view store settings" on store_settings for select using (true);
create policy "Admins update store settings" on store_settings for update using (is_admin());