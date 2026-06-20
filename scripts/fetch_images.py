import json
import urllib.request
import urllib.parse
import time
import os

JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'catalogo-figurinhas.json')

# Map of FWC items to specific Wikipedia page titles
FWC_MAPPING = {
    "FWC-00": "FIFA_World_Cup_Trophy", # Taça da Copa
    "FWC-01": "Zabivaka", # Mascote genérico (usando 2018 como placeholder pois 2026 ainda não tem um famoso na wiki)
    "FWC-02": "Estadio_Azteca",
    "FWC-03": "MetLife_Stadium",
    "FWC-04": "AT&T_Stadium",
    "FWC-05": "Arrowhead_Stadium",
    "FWC-06": "Mercedes-Benz_Stadium",
    "FWC-07": "Gillette_Stadium",
    "FWC-08": "NRG_Stadium",
    "FWC-09": "SoFi_Stadium",
    "FWC-10": "Hard_Rock_Stadium",
    "FWC-11": "Lincoln_Financial_Field",
    "FWC-12": "Levi's_Stadium",
    "FWC-13": "Lumen_Field",
    "FWC-14": "BMO_Field",
    "FWC-15": "BC_Place",
    "FWC-16": "Estadio_Akron",
    "FWC-17": "Estadio_BBVA",
    "FWC-18": "FIFA_World_Cup", # Logo / Pôster 1
    "FWC-19": "2026_FIFA_World_Cup" # Logo / Pôster 2
}

def fetch_wiki_image(title):
    try:
        encoded_title = urllib.parse.quote(title.replace(' ', '_'))
        url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=300&titles={encoded_title}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (CopaApp/1.0)'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        pages = data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if 'thumbnail' in page_data:
                return page_data['thumbnail']['source']
    except Exception as e:
        print(f"Erro ao buscar {title}: {e}")
    return None

def main():
    print("Carregando catálogo...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        catalogo = json.load(f)

    print(f"Total de itens: {len(catalogo)}")
    
    updated_count = 0
    
    for item in catalogo:
        # Pular se já tem image_url válido (para recomeçar se falhar)
        if item.get('image_url'):
            continue
            
        codigo = item['codigo']
        nome = item['nome_jogador']
        
        # Escudos e Logos não buscam imagem de jogador (usarão a lógica do flagcdn no front)
        if item.get('tipo') == 'escudo' and codigo not in FWC_MAPPING:
            continue
            
        search_title = nome
        if codigo in FWC_MAPPING:
            search_title = FWC_MAPPING[codigo]
            
        print(f"Buscando imagem para: {search_title} ({codigo})...")
        image_url = fetch_wiki_image(search_title)
        
        if image_url:
            item['image_url'] = image_url
            updated_count += 1
            print(f"  Encontrado: {image_url}")
        else:
            print(f"  Não encontrado.")
            
        # Rate limit polite
        time.sleep(0.05)
        
        # Save every 50 updates to avoid losing progress
        if updated_count > 0 and updated_count % 50 == 0:
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(catalogo, f, ensure_ascii=False, indent=2)
            print(f" Progresso salvo ({updated_count} atualizadas)")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, ensure_ascii=False, indent=2)
        
    print(f"Concluído! {updated_count} novas imagens encontradas e salvas.")

if __name__ == '__main__':
    main()
