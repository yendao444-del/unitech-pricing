use base64::{engine::general_purpose::STANDARD, Engine as _};
use minisign_verify::{PublicKey, Signature};
use serde_json::Value;
use std::{env, error::Error, fs, path::Path};

fn required_string<'a>(value: &'a Value, path: &[&str]) -> Result<&'a str, Box<dyn Error>> {
    let mut current = value;
    for key in path {
        current = current
            .get(*key)
            .ok_or_else(|| format!("Missing JSON field: {}", path.join(".")))?;
    }
    current
        .as_str()
        .ok_or_else(|| format!("JSON field is not a string: {}", path.join(".")).into())
}

fn decode_base64_text(value: &str, label: &str) -> Result<String, Box<dyn Error>> {
    let bytes = STANDARD.decode(value.trim())?;
    String::from_utf8(bytes).map_err(|_| format!("{label} is not valid UTF-8").into())
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 5 {
        return Err("Usage: updater-verifier <latest.json> <installer.exe> <tauri.conf.json> <expected-version>".into());
    }

    let manifest_path = Path::new(&args[1]);
    let installer_path = Path::new(&args[2]);
    let config_path = Path::new(&args[3]);
    let expected_version = args[4].trim_start_matches('v');

    let manifest_bytes = fs::read(manifest_path)?;
    if manifest_bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return Err("latest.json contains a UTF-8 BOM".into());
    }

    let manifest: Value = serde_json::from_slice(&manifest_bytes)?;
    let version = required_string(&manifest, &["version"])?;
    if version != expected_version {
        return Err(format!("Expected version {expected_version}, got {version}").into());
    }

    let platform = &["platforms", "windows-x86_64"];
    let signature_text = required_string(&manifest, &[platform[0], platform[1], "signature"])?;
    let download_url = required_string(&manifest, &[platform[0], platform[1], "url"])?;
    let expected_url_suffix = format!("/DBY.Label.Pricing_{}_x64-setup.exe", expected_version);
    if !download_url
        .starts_with("https://github.com/yendao444-del/unitech-pricing/releases/download/")
        || !download_url.ends_with(&expected_url_suffix)
    {
        return Err(format!("Unexpected updater URL: {download_url}").into());
    }

    let signature_file = format!("{}.sig", installer_path.display());
    if Path::new(&signature_file).exists() {
        let file_signature = fs::read_to_string(&signature_file)?;
        if file_signature.trim() != signature_text.trim() {
            return Err("latest.json signature differs from the .sig file".into());
        }
    }

    let config: Value = serde_json::from_slice(&fs::read(config_path)?)?;
    let public_key_text = required_string(&config, &["plugins", "updater", "pubkey"])?;
    let public_key =
        PublicKey::decode(&decode_base64_text(public_key_text, "Updater public key")?)?;
    let signature = Signature::decode(&decode_base64_text(signature_text, "Updater signature")?)?;
    let installer = fs::read(installer_path)?;
    public_key.verify(&installer, &signature, true)?;

    println!(
        "Updater verified: version={}, bytes={}, signature=valid",
        version,
        installer.len()
    );
    Ok(())
}
