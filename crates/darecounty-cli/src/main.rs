use clap::{Parser, Subcommand};
use darecounty_common::client::DareCountyClient;
use darecounty_common::config::DareCountyConfig;
use darecounty_common::types::{MailingRecord, Parcel};
use darecounty_sys::ReqwestTransport;
use std::io::Write;

#[derive(Parser)]
#[command(name = "darecounty")]
#[command(about = "Dare County GIS property data CLI")]
struct Cli {
    /// Output format: json, csv, or table (default)
    #[arg(long, short, default_value = "table")]
    format: OutputFormat,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Clone, Debug, clap::ValueEnum)]
enum OutputFormat {
    Table,
    Json,
    Csv,
}

#[derive(Subcommand)]
enum Commands {
    /// Search for properties by parcel, PIN, owner, or address (autocomplete)
    Search {
        /// Search term
        term: String,
    },

    /// Look up a specific parcel by parcel number
    Parcel {
        /// Parcel number (e.g. 000012000)
        number: String,
    },

    /// Find all properties for an owner name
    Owner {
        /// Owner name to search (partial match)
        name: String,
    },

    /// Find all properties on a street
    Street {
        /// Street name (partial match)
        name: String,
    },

    /// Find all properties in a subdivision
    Subdivision {
        /// Subdivision name (partial match)
        name: String,
    },

    /// Find all properties in a town
    Town {
        /// Town name (e.g. NAGS HEAD, KILL DEVIL HILLS)
        name: String,
    },

    /// Run a raw CQL filter query against the GeoServer WFS
    Query {
        /// CQL filter expression (e.g. "owner1 LIKE '%SMITH%' AND zipname='NAGS HEAD'")
        cql: String,
    },

    /// Dump every parcel in the county (~48k records)
    All {
        /// Output file path (default: stdout)
        #[arg(long, short)]
        output: Option<String>,
    },

    /// Export a mailing list CSV for properties matching a filter
    #[command(name = "mailing-list")]
    MailingList {
        /// Filter type: owner, street, subdivision, town, or cql
        #[arg(long)]
        by: FilterType,

        /// Filter value
        value: String,

        /// Output file path (default: stdout)
        #[arg(long, short)]
        output: Option<String>,
    },

    /// List available streets (autocomplete)
    Streets {
        /// Search term
        term: String,
    },

    /// List available subdivisions (autocomplete)
    Subdivisions {
        /// Search term
        term: String,
    },

    /// List available owner names (autocomplete)
    Owners {
        /// Search term
        term: String,
    },
}

#[derive(Clone, Debug, clap::ValueEnum)]
enum FilterType {
    All,
    Owner,
    Street,
    Subdivision,
    Town,
    Cql,
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let cli = Cli::parse();
    let client = DareCountyClient::new(DareCountyConfig::default(), ReqwestTransport::new());

    if let Err(e) = run(&client, &cli).await {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}

async fn run(
    client: &DareCountyClient<ReqwestTransport>,
    cli: &Cli,
) -> Result<(), darecounty_common::error::DareCountyError> {
    match &cli.command {
        Commands::Search { term } => {
            let results = client.search(term).await?;
            match cli.format {
                OutputFormat::Json => {
                    println!("{}", serde_json::to_string_pretty(&results)?);
                }
                OutputFormat::Csv => {
                    let mut wtr = csv::Writer::from_writer(std::io::stdout());
                    for r in &results {
                        wtr.serialize(r).unwrap();
                    }
                    wtr.flush().unwrap();
                }
                OutputFormat::Table => {
                    println!(
                        "{:<12} {:<15} {:<30} {:<50}",
                        "PARCEL", "PIN", "OWNER", "ADDRESS"
                    );
                    println!("{}", "-".repeat(107));
                    for r in &results {
                        println!(
                            "{:<12} {:<15} {:<30} {:<50}",
                            r.parcel,
                            r.pin,
                            truncate(&r.owner1, 28),
                            truncate(&r.address, 48),
                        );
                    }
                    println!("\n{} results", results.len());
                }
            }
        }

        Commands::Parcel { number } => {
            let parcel = client.get_parcel(number).await?;
            match parcel {
                Some(p) => print_parcels(&[p], &cli.format),
                None => eprintln!("Parcel {} not found", number),
            }
        }

        Commands::Owner { name } => {
            let parcels = client.parcels_by_owner(name).await?;
            eprintln!("Found {} properties", parcels.len());
            print_parcels(&parcels, &cli.format);
        }

        Commands::Street { name } => {
            let parcels = client.parcels_by_street(name).await?;
            eprintln!("Found {} properties", parcels.len());
            print_parcels(&parcels, &cli.format);
        }

        Commands::Subdivision { name } => {
            let parcels = client.parcels_by_subdivision(name).await?;
            eprintln!("Found {} properties", parcels.len());
            print_parcels(&parcels, &cli.format);
        }

        Commands::Town { name } => {
            let parcels = client.parcels_by_town(name).await?;
            eprintln!("Found {} properties", parcels.len());
            print_parcels(&parcels, &cli.format);
        }

        Commands::Query { cql } => {
            let parcels = client.parcels_by_cql(cql).await?;
            eprintln!("Found {} properties", parcels.len());
            print_parcels(&parcels, &cli.format);
        }

        Commands::All { output } => {
            let parcels = client
                .all_parcels(|n| eprint!("\rFetching parcels... {}", n))
                .await?;
            eprintln!("\rFetched {} parcels total    ", parcels.len());

            let writer: Box<dyn Write> = match output {
                Some(path) => Box::new(std::fs::File::create(path).map_err(|e| {
                    darecounty_common::error::DareCountyError::Other(e.to_string())
                })?),
                None => Box::new(std::io::stdout()),
            };

            match cli.format {
                OutputFormat::Csv => {
                    let records: Vec<MailingRecord> =
                        parcels.iter().map(MailingRecord::from).collect();
                    let mut wtr = csv::Writer::from_writer(writer);
                    for r in &records {
                        wtr.serialize(r).unwrap();
                    }
                    wtr.flush().unwrap();
                }
                OutputFormat::Json => {
                    let json = serde_json::to_string_pretty(&parcels)?;
                    let mut writer = writer;
                    writer.write_all(json.as_bytes()).unwrap();
                    writer.write_all(b"\n").unwrap();
                }
                OutputFormat::Table => {
                    print_parcels(&parcels, &cli.format);
                }
            }
        }

        Commands::MailingList { by, value, output } => {
            let parcels = match by {
                FilterType::All => {
                    client
                        .all_parcels(|n| eprint!("\rFetching parcels... {}", n))
                        .await?
                }
                FilterType::Owner => client.parcels_by_owner(value).await?,
                FilterType::Street => client.parcels_by_street(value).await?,
                FilterType::Subdivision => client.parcels_by_subdivision(value).await?,
                FilterType::Town => client.parcels_by_town(value).await?,
                FilterType::Cql => client.parcels_by_cql(value).await?,
            };

            let records: Vec<MailingRecord> = parcels.iter().map(MailingRecord::from).collect();
            eprintln!("Exporting {} mailing records", records.len());

            let writer: Box<dyn Write> = match output {
                Some(path) => Box::new(std::fs::File::create(path).map_err(|e| {
                    darecounty_common::error::DareCountyError::Other(e.to_string())
                })?),
                None => Box::new(std::io::stdout()),
            };

            let mut wtr = csv::Writer::from_writer(writer);
            for r in &records {
                wtr.serialize(r).unwrap();
            }
            wtr.flush().unwrap();
        }

        Commands::Streets { term } => {
            let results = client.search_streets(term).await?;
            match cli.format {
                OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&results)?),
                _ => {
                    for r in &results {
                        println!("{} {} ({})", r.value, r.stsuffix, r.city);
                    }
                }
            }
        }

        Commands::Subdivisions { term } => {
            let results = client.search_subdivisions(term).await?;
            match cli.format {
                OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&results)?),
                _ => {
                    for r in &results {
                        println!("{}", r.value);
                    }
                }
            }
        }

        Commands::Owners { term } => {
            let results = client.search_owners(term).await?;
            match cli.format {
                OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&results)?),
                _ => {
                    for r in &results {
                        println!("{}", r.label);
                    }
                }
            }
        }
    }

    Ok(())
}

fn print_parcels(parcels: &[Parcel], format: &OutputFormat) {
    match format {
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(parcels).unwrap());
        }
        OutputFormat::Csv => {
            let records: Vec<MailingRecord> = parcels.iter().map(MailingRecord::from).collect();
            let mut wtr = csv::Writer::from_writer(std::io::stdout());
            for r in &records {
                wtr.serialize(r).unwrap();
            }
            wtr.flush().unwrap();
        }
        OutputFormat::Table => {
            println!(
                "{:<12} {:<28} {:<40} {:<40}",
                "PARCEL", "OWNER", "SITE ADDRESS", "MAILING ADDRESS"
            );
            println!("{}", "-".repeat(120));
            for p in parcels {
                println!(
                    "{:<12} {:<28} {:<40} {:<40}",
                    p.parcel,
                    truncate(&p.owner1, 26),
                    truncate(&p.site_address(), 38),
                    truncate(&p.mailing_address(), 38),
                );
            }
        }
    }
}

fn truncate(s: &str, max: usize) -> String {
    let s = s.trim();
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.saturating_sub(3)])
    }
}
