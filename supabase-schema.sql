-- Kainos Tees — Supabase Schema
-- Run this in the Supabase SQL Editor

----------------------------------
-- PROFILES (extends auth.users)
----------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- trigger to create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), 'user');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

----------------------------------
-- COLLECTIONS
----------------------------------
create table if not exists collections (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default '',
  bg_color text not null default '#111',
  text_color text not null default '#fff'
);

alter table collections enable row level security;

create policy "Collections are public"
  on collections for select using (true);

create policy "Admins can insert collections"
  on collections for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update collections"
  on collections for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete collections"
  on collections for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

----------------------------------
-- PRODUCTS
----------------------------------
create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  old_price numeric(10,2),
  tag text,
  collection_id text references collections(id),
  image text not null default '',
  featured boolean default false,
  is_new boolean default false,
  rating numeric(3,1) default 4.0,
  reviews integer default 0,
  sizes text[] not null default '{}',
  colors jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table products enable row level security;

create policy "Products are public"
  on products for select using (true);

create policy "Admins can insert products"
  on products for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update products"
  on products for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete products"
  on products for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

----------------------------------
-- CART ITEMS
----------------------------------
create table if not exists cart_items (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id bigint references products(id) on delete cascade not null,
  size text not null,
  color jsonb not null,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  unique (user_id, product_id, size, color)
);

alter table cart_items enable row level security;

create policy "Users can read own cart"
  on cart_items for select using (auth.uid() = user_id);

create policy "Users can insert own cart"
  on cart_items for insert with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on cart_items for update using (auth.uid() = user_id);

create policy "Users can delete own cart"
  on cart_items for delete using (auth.uid() = user_id);

----------------------------------
-- ORDERS
----------------------------------
create table if not exists orders (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  email text not null,
  total numeric(10,2) not null,
  status text not null default 'Confirmed' check (status in ('Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
  shipping_address jsonb not null default '{}',
  payment_intent text,
  created_at timestamptz default now()
);

alter table orders enable row level security;

create policy "Users can read own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Admins can read all orders"
  on orders for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert own orders"
  on orders for insert with check (auth.uid() = user_id);

create policy "Admins can update orders"
  on orders for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

----------------------------------
-- ORDER ITEMS
----------------------------------
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id text references orders(id) on delete cascade not null,
  product_id bigint references products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  size text not null,
  color jsonb not null,
  quantity integer not null default 1,
  image text
);

alter table order_items enable row level security;

create policy "Users can read own order items"
  on order_items for select using (
    exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
  );

create policy "Admins can read all order items"
  on order_items for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert order items"
  on order_items for insert with check (
    exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
  );

----------------------------------
-- SUPPORT TICKETS
----------------------------------
create table if not exists support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  email text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

alter table support_tickets enable row level security;

create policy "Users can read own tickets"
  on support_tickets for select using (auth.uid() = user_id);

create policy "Admins can read all tickets"
  on support_tickets for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can create tickets"
  on support_tickets for insert with check (auth.uid() = user_id);

----------------------------------
-- TICKET MESSAGES
----------------------------------
create table if not exists ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id bigint references support_tickets(id) on delete cascade not null,
  sender text not null check (sender in ('customer', 'admin')),
  message text not null,
  created_at timestamptz default now()
);

alter table ticket_messages enable row level security;

create policy "Users can read own ticket messages"
  on ticket_messages for select using (
    exists (select 1 from support_tickets where id = ticket_messages.ticket_id and user_id = auth.uid())
  );

create policy "Admins can read all ticket messages"
  on ticket_messages for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert messages to own tickets"
  on ticket_messages for insert with check (
    exists (select 1 from support_tickets where id = ticket_messages.ticket_id and user_id = auth.uid())
  );

----------------------------------
-- NEWSLETTER SUBSCRIBERS
----------------------------------
create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text unique not null,
  created_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on newsletter_subscribers for insert with check (true);

create policy "Admins can read subscribers"
  on newsletter_subscribers for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
