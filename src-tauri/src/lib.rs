mod commands {
    use serde::{Deserialize, Serialize};
    use std::env;
    use std::process::Command;
    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct WhiteRollQuoteInput {
        pub width_mm: f64,
        pub meters: f64,
        pub paper_price: f64,
        pub processing_fee: f64,
        pub fixed_surcharge: f64,
        pub processing_rate_per_m2: f64,
        pub lamination_rate_per_m2: f64,
        pub quantity: f64,
    }

    #[derive(Debug, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct WhiteRollQuoteResult {
        pub useful_width_m: f64,
        pub material_area_m2: f64,
        pub paper_cost: f64,
        pub processing_fee: f64,
        pub surcharge_cost: f64,
        pub lamination_cost: f64,
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
    pub fn calculate_white_roll_quote(
        input: WhiteRollQuoteInput,
    ) -> Result<WhiteRollQuoteResult, String> {
        if input.width_mm < 0.0
            || input.meters < 0.0
            || input.paper_price < 0.0
            || input.processing_fee < 0.0
            || input.fixed_surcharge < 0.0
            || input.processing_rate_per_m2 < 0.0
            || input.lamination_rate_per_m2 < 0.0
            || input.quantity < 0.0
        {
            return Err("Thông số tính giá không được là số âm".into());
        }

        let has_pricing_inputs =
            input.width_mm > 0.0 && input.meters > 0.0 && input.paper_price > 0.0;
        let useful_width_m = if input.width_mm > 0.0 {
            (input.width_mm + 5.0) / 1_000.0
        } else {
            0.0
        };
        let material_area_m2 = useful_width_m * input.meters;
        let paper_cost = if has_pricing_inputs {
            material_area_m2 * input.paper_price
        } else {
            0.0
        };
        let surcharge_cost = if has_pricing_inputs {
            input.fixed_surcharge
        } else {
            0.0
        };
        let lamination_cost = if has_pricing_inputs {
            material_area_m2 * input.lamination_rate_per_m2
        } else {
            0.0
        };
        let effective_processing_fee = if has_pricing_inputs {
            input.processing_fee + (material_area_m2 * input.processing_rate_per_m2)
        } else {
            0.0
        };
        let unit_cost = round_up_thousand(
            paper_cost + effective_processing_fee + surcharge_cost + lamination_cost,
        );

        Ok(WhiteRollQuoteResult {
            useful_width_m,
            material_area_m2,
            paper_cost,
            processing_fee: effective_processing_fee,
            surcharge_cost,
            lamination_cost,
            unit_cost,
            quantity: input.quantity,
            order_cost: unit_cost * input.quantity,
        })
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn formula_five_uses_color_cover_as_processing_fee() {
            let result = calculate_white_roll_quote(WhiteRollQuoteInput {
                width_mm: 95.0,
                meters: 50.0,
                paper_price: 8_000.0,
                processing_fee: 0.0,
                fixed_surcharge: 0.0,
                processing_rate_per_m2: 4_000.0,
                lamination_rate_per_m2: 0.0,
                quantity: 2.0,
            })
            .expect("formula 5 should calculate");

            assert_eq!(result.material_area_m2, 5.0);
            assert_eq!(result.paper_cost, 40_000.0);
            assert_eq!(result.processing_fee, 20_000.0);
            assert_eq!(result.surcharge_cost, 0.0);
            assert_eq!(result.unit_cost, 60_000.0);
            assert_eq!(result.order_cost, 120_000.0);
        }

        #[test]
        fn fixed_roll_surcharge_stays_separate_from_formula_five_rate() {
            let result = calculate_white_roll_quote(WhiteRollQuoteInput {
                width_mm: 95.0,
                meters: 50.0,
                paper_price: 8_000.0,
                processing_fee: 4_000.0,
                fixed_surcharge: 0.0,
                processing_rate_per_m2: 0.0,
                lamination_rate_per_m2: 0.0,
                quantity: 1.0,
            })
            .expect("fixed surcharge formula should calculate");

            assert_eq!(result.material_area_m2, 5.0);
            assert_eq!(result.surcharge_cost, 0.0);
            assert_eq!(result.unit_cost, 51_000.0);
        }

        #[test]
        fn fixed_surcharge_is_zero_until_required_inputs_are_present() {
            let result = calculate_white_roll_quote(WhiteRollQuoteInput {
                width_mm: 0.0,
                meters: 0.0,
                paper_price: 0.0,
                processing_fee: 0.0,
                fixed_surcharge: 11_000.0,
                processing_rate_per_m2: 0.0,
                lamination_rate_per_m2: 0.0,
                quantity: 0.0,
            })
            .expect("empty form should return an empty calculation");

            assert_eq!(result.useful_width_m, 0.0);
            assert_eq!(result.surcharge_cost, 0.0);
            assert_eq!(result.unit_cost, 0.0);
            assert_eq!(result.order_cost, 0.0);
        }

        #[test]
        fn formula_six_charges_processing_and_lamination_per_square_meter() {
            let result = calculate_white_roll_quote(WhiteRollQuoteInput {
                width_mm: 95.0,
                meters: 50.0,
                paper_price: 8_000.0,
                processing_fee: 0.0,
                fixed_surcharge: 0.0,
                processing_rate_per_m2: 4_000.0,
                lamination_rate_per_m2: 3_000.0,
                quantity: 2.0,
            })
            .expect("formula 6 should calculate");

            assert_eq!(result.material_area_m2, 5.0);
            assert_eq!(result.paper_cost, 40_000.0);
            assert_eq!(result.processing_fee, 20_000.0);
            assert_eq!(result.surcharge_cost, 0.0);
            assert_eq!(result.lamination_cost, 15_000.0);
            assert_eq!(result.unit_cost, 75_000.0);
            assert_eq!(result.order_cost, 150_000.0);
        }
    }

    #[tauri::command]
    pub fn calculate_label_piece_quote(
        input: LabelPieceQuoteInput,
    ) -> Result<LabelPieceQuoteResult, String> {
        if input.width_mm < 0.0
            || input.length_mm < 0.0
            || input.paper_price < 0.0
            || input.processing_fee < 0.0
            || input.quantity < 0.0
        {
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
        if input.width_mm < 0.0
            || input.height_mm < 0.0
            || input.labels_per_roll < 0.0
            || input.paper_price < 0.0
            || input.processing_fee < 0.0
            || input.quantity < 0.0
        {
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
        let label_count = if pitch_m == 0.0 {
            0.0
        } else {
            input.meters / pitch_m
        };
        let whole_labels = label_count.floor() as u64;

        Ok(LabelCountFromRollResult {
            pitch_m,
            label_count,
            whole_labels,
        })
    }

    #[tauri::command]
    pub fn open_downloads_folder() -> Result<(), String> {
        let user_profile = env::var("USERPROFILE")
            .map_err(|_| "KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c thÆ° má»¥c ngÆ°á»i dÃ¹ng Windows")?;
        let downloads = std::path::PathBuf::from(user_profile).join("Downloads");

        Command::new("explorer.exe")
            .arg(downloads)
            .spawn()
            .map_err(|error| format!("KhÃ´ng má»Ÿ Ä‘Æ°á»£c thÆ° má»¥c Downloads: {error}"))?;

        Ok(())
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
            commands::calculate_label_count_from_roll,
            commands::open_downloads_folder
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
