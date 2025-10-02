import csv
import json
from typing import Dict, List, Union, Optional

def parse_superficie(superficie: str) -> Union[str, List[Dict[str, Union[float, str]]]]:
    if not superficie or superficie.isspace():
        return ""
    
    # Check if the superficie contains "ha" or "km2"
    if "ha" in superficie and "km2" in superficie:
        # Parse both hectares and square kilometers
        ha = float(superficie.split("ha")[0].strip())
        km2 = float(superficie.split("(")[1].split("km2")[0].strip())
        return [
            {"valeur": ha, "unite": "ha"},
            {"valeur": km2, "unite": "km2"}
        ]
    return superficie

def convert_csv_to_json(csv_file: str) -> List[Dict]:
    lakes = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        for row in reader:
            lake = {
                "nomDuLac": row["Nom du lac"],
                "juridiction": {
                    "type": "gouvernementale",
                    "organisme": "SEPAQ" if "SEPAQ" in row["Type"] else "Territoire",
                    "site": row["Secteur"] if row["Secteur"] != "-" else None
                },
                "regionAdministrativeQuebec": row["Region"],
                "coordonnees": {
                    "latitude": float(row["latitude"]) if row["latitude"] else None,
                    "longitude": float(row["longitude"]) if row["longitude"] else None
                },
                "superficie": parse_superficie(row["Superficie"]),
                "acces": {
                    "portage": row["Portage"],
                    "acceuil": row["Acceuil"] if row["Acceuil"] != "-" else None,
                    "distanceAcceuilLac": row["Distance Acceuil"] if row["Distance Acceuil"] else "0",
                    "accessible": row["Accessible en"].lower()
                },
                "embarcation": {
                    "type": row["Type d'embarcation"],
                    "motorisation": parse_motorisation(row["Type de moteur"])
                },
                "espece": [espece.strip() for espece in row["Espèces"].split(",")] if row["Espèces"] else []
            }
            
            # Add hebergement if available
            if row["Hebergement"] and row["Hebergement"] != "-":
                lake["hebergement"] = [{
                    "camping": row["Hebergement"],
                    "distanceCampingAcceuil": row["Distance Hebergement"] if row["Distance Hebergement"] != "-" else "0",
                    "coordonnees": {
                        "latitude": float(row["latitude"]) if row["latitude"] else None,
                        "longitude": float(row["longitude"]) if row["longitude"] else None
                    }
                }]
            
            lakes.append(lake)
    
    return lakes

def parse_motorisation(moteur: str) -> Dict:
    if not moteur or moteur.isspace():
        return {"electrique": False}
    
    if "lectrique" in moteur:
        return {"electrique": True}
    
    if "minimum" in moteur.lower() and "maximum" in moteur.lower():
        min_cv = moteur.split("minimum")[1].split(",")[0].strip()
        max_cv = moteur.split("maximum")[1].strip()
        return {
            "electrique": False,
            "gas": {
                "min": min_cv,
                "max": max_cv
            }
        }
    
    if "minimum" in moteur.lower():
        min_cv = moteur.split("minimum")[1].strip()
        return {
            "electrique": False,
            "gas": {
                "min": min_cv
            }
        }
    
    return {"electrique": False}

def main():
    # Convertir le CSV en JSON
    lakes = convert_csv_to_json('pecheplaneau.csv')
    
    # Écrire le résultat dans un fichier JSON
    with open('lakes_for_mongodb.json', 'w', encoding='utf-8') as f:
        json.dump(lakes, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()