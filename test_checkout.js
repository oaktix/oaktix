const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: event } = await supabase.from('events').select('*').eq('slug', 'valid-early-bird').single();
  
  const tier = event.ticket_types[0];
  const ticket_type_name = tier.name;
  const quantity = 1;

  const { count: soldCount } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .in("status", ["active", "used"])
      .filter("ticket_type->>name", "eq", ticket_type_name);

  const currentSoldCount = soldCount || 0;

  let effectivePrice = Number(tier.price);
  const now = new Date();
  
  const isEarlyBirdConfigured = tier.early_bird_price !== undefined && tier.early_bird_price !== null;
  const isExpiredByDate = tier.early_bird_until ? new Date(tier.early_bird_until) < now : false;
  const hasCapacityLeft = tier.early_bird_capacity ? currentSoldCount < tier.early_bird_capacity : true;
  
  console.log({
    isEarlyBirdConfigured,
    isExpiredByDate,
    hasCapacityLeft,
    currentSoldCount,
    early_bird_capacity: tier.early_bird_capacity,
    tier_price: tier.price,
    early_bird_price: tier.early_bird_price,
    early_bird_until: tier.early_bird_until
  });

  if (isEarlyBirdConfigured && !isExpiredByDate && hasCapacityLeft) {
    effectivePrice = Number(tier.early_bird_price);
  }

  const originalSubtotal = effectivePrice * Number(quantity);
  const discountedSubtotal = originalSubtotal;

  let platformFeePercent = 4.0;
  const F = platformFeePercent / 100;
  let expectedTotalAmount = discountedSubtotal;
  
  if (F > 0) {
    if (event.absorb_fees) {
      expectedTotalAmount = discountedSubtotal;
    } else {
      const platform_fee = discountedSubtotal * F;
      expectedTotalAmount = discountedSubtotal + platform_fee;
    }
  }

  console.log(`Backend expects: ${expectedTotalAmount}`);
  
  // Frontend logic
  const fe_isEarlyBirdActive = isEarlyBirdConfigured && !isExpiredByDate && hasCapacityLeft;
  const fe_effectivePrice = fe_isEarlyBirdActive ? tier.early_bird_price : tier.price;
  const fe_originalSubtotal = fe_effectivePrice * quantity;
  const fe_baseAmount = Math.max(0, fe_originalSubtotal);
  const fe_serviceFee = event.absorb_fees ? 0 : fe_baseAmount * (platformFeePercent / 100);
  const fe_totalAmount = fe_baseAmount + fe_serviceFee;
  
  console.log(`Frontend sends: ${fe_totalAmount}`);
}
run();
