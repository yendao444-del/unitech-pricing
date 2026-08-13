mod commands {
use serde::{Deserialize, Serialize};
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhiteRollQuoteInput {
  pub width_mm: f64,
  pub meters: f64,
  pub paper_price: f64,
  pub processing_fee: f64,
  pub quantity: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WhiteRollQuoteResult {
  pub useful_width_m: f64,
  pub material_area_m2: f64,
  pub paper_cost: f64,
  pub processing_fee: f64,
  pub unit_cost: f64,
  pub quantity: f64,
  pub order_cost: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelPieceQuoteInput {
  pub width_mm: f64,
  pub length_mm: f64,
  pub paper_price: f64,
  pub processing_fee: f64,
  pub quantity: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelPieceQuoteResult {
  pub material_area_m2: f64,
  pub rate_per_m2: f64,
  pub unit_cost: f64,
  pub quantity: f64,
  pub order_cost: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelRollByCountQuoteInput {
  pub width_mm: f64,
  pub height_mm: f64,
  pub labels_per_roll: f64,
  pub paper_price: f64,
  pub processing_fee: f64,
  pub quantity: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelRollByCountQuoteResult {
  pub derived_meters: f64,
  pub useful_width_m: f64,
  pub material_area_m2: f64,
  pub paper_cost: f64,
  pub processing_fee: f64,
  pub unit_cost: f64,
  pub quantity: f64,
  pub order_cost: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelCountFromRollInput {
  pub height_mm: f64,
  pub meters: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelCountFromRollResult {
  pub pitch_m: f64,
  pub label_count: f64,
  pub whole_labels: u64,
}

fn round_up_thousand(value: f64) -> f64 {
  (value / 1_000.0).ceil() * 1_000.0
}

#[tauri::command]
pub fn calculate_white_roll_quote(input: WhiteRollQuoteInput) -> Result<WhiteRollQuoteResult, String> {
  if input.width_mm < 0.0 || input.meters < 0.0 || input.paper_price < 0.0 || input.processing_fee < 0.0 || input.quantity < 0.0 {
    return Err("Thông số tính giá không được là số âm".into());
  }

  let useful_width_m = (input.width_mm + 5.0) / 1_000.0;
  let material_area_m2 = useful_width_m * input.meters;
  let paper_cost = material_area_m2 * input.paper_price;
  let unit_cost = round_up_thousand(paper_cost + input.processing_fee);

  Ok(WhiteRollQuoteResult {
    useful_width_m,
    material_area_m2,
    paper_cost,
    processing_fee: input.processing_fee,
    unit_cost,
    quantity: input.quantity,
    order_cost: unit_cost * input.quantity,
  })
}

#[tauri::command]
pub fn calculate_label_piece_quote(input: LabelPieceQuoteInput) -> Result<LabelPieceQuoteResult, String> {
  if input.width_mm < 0.0 || input.length_mm < 0.0 || input.paper_price < 0.0 || input.processing_fee < 0.0 || input.quantity < 0.0 {
    return Err("Thông số tính giá không được là số âm".into());
  }

  let material_area_m2 = (input.width_mm * input.length_mm) / 1_000_000.0;
  let rate_per_m2 = input.paper_price + input.processing_fee;
  let unit_cost = (material_area_m2 * rate_per_m2).ceil();
  let order_cost = round_up_thousand(unit_cost * input.quantity);

  Ok(LabelPieceQuoteResult {
    material_area_m2,
    rate_per_m2,
    unit_cost,
    quantity: input.quantity,
    order_cost,
  })
}

#[tauri::command]
pub fn calculate_label_roll_by_count_quote(
  input: LabelRollByCountQuoteInput,
) -> Result<LabelRollByCountQuoteResult, String> {
  if input.width_mm < 0.0 || input.height_mm < 0.0 || input.labels_per_roll < 0.0 || input.paper_price < 0.0 || input.processing_fee < 0.0 || input.quantity < 0.0 {
    return Err("Thông số tính giá không được là số âm".into());
  }

  let derived_meters = ((input.height_mm + 3.0) / 1_000.0) * input.labels_per_roll;
  let useful_width_m = (input.width_mm + 5.0) / 1_000.0;
  let material_area_m2 = useful_width_m * derived_meters;
  let paper_cost = material_area_m2 * input.paper_price;
  let unit_cost = round_up_thousand(paper_cost + input.processing_fee);

  Ok(LabelRollByCountQuoteResult {
    derived_meters,
    useful_width_m,
    material_area_m2,
    paper_cost,
    processing_fee: input.processing_fee,
    unit_cost,
    quantity: input.quantity,
    order_cost: unit_cost * input.quantity,
  })
}

#[tauri::command]
pub fn calculate_label_count_from_roll(
  input: LabelCountFromRollInput,
) -> Result<LabelCountFromRollResult, String> {
  if input.height_mm < 0.0 || input.meters < 0.0 {
    return Err("Thông số tính giá không được là số âm".into());
  }

  let pitch_m = (input.height_mm + 3.0) / 1_000.0;
  let label_count = if pitch_m == 0.0 { 0.0 } else { input.meters / pitch_m };
  let whole_labels = label_count.floor() as u64;

  Ok(LabelCountFromRollResult { pitch_m, label_count, whole_labels })
}
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      commands::calculate_white_roll_quote,
      commands::calculate_label_piece_quote,
      commands::calculate_label_roll_by_count_quote,
      commands::calculate_label_count_from_roll
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
