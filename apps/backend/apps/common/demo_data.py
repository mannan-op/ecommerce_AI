"""Static demo catalog and account data for local development."""

DEMO_CATEGORIES = [
    {
        "slug": "kurta",
        "name": "Kurta",
        "description": "Traditional and contemporary kurtas for everyday and festive wear.",
    },
    {
        "slug": "lawn-suits",
        "name": "Lawn Suits",
        "description": "Premium lawn collections with dupatta and trouser options.",
    },
    {
        "slug": "unstitched-fabric",
        "name": "Unstitched Fabric",
        "description": "Unstitched suits and yardage for custom tailoring.",
    },
    {
        "slug": "shawls-dupattas",
        "name": "Shawls & Dupattas",
        "description": "Embroidered dupattas, shawls, and seasonal wraps.",
    },
    {
        "slug": "mens-wear",
        "name": "Men's Wear",
        "description": "Kurtas, waistcoats, and shalwar kameez for men.",
    },
]

DEMO_PRODUCTS = [
    {
        "category": "kurta",
        "slug": "embroidered-cotton-kurta",
        "name": "Embroidered Cotton Kurta",
        "description": (
            "Breathable cotton kurta with delicate thread embroidery. "
            "Ideal for Eid and family gatherings."
        ),
        "image_color": (176, 98, 89),
        "variants": [
            {"sku": "KURTA-EMB-COT-WHT-M", "price": "34.99", "fabric": "cotton", "color": "white", "size": "M", "stock": 25},
            {"sku": "KURTA-EMB-COT-WHT-L", "price": "34.99", "fabric": "cotton", "color": "white", "size": "L", "stock": 18},
            {"sku": "KURTA-EMB-COT-MRN-M", "price": "36.99", "fabric": "cotton", "color": "maroon", "size": "M", "stock": 12},
        ],
    },
    {
        "category": "kurta",
        "slug": "linen-summer-kurta",
        "name": "Linen Summer Kurta",
        "description": "Lightweight linen kurta with a relaxed fit for hot weather.",
        "image_color": (135, 169, 156),
        "variants": [
            {"sku": "KURTA-LIN-SKY-M", "price": "29.99", "fabric": "linen", "color": "sky blue", "size": "M", "stock": 30},
            {"sku": "KURTA-LIN-SKY-L", "price": "29.99", "fabric": "linen", "color": "sky blue", "size": "L", "stock": 22},
            {"sku": "KURTA-LIN-OLV-M", "price": "31.99", "fabric": "linen", "color": "olive", "size": "M", "stock": 15},
        ],
    },
    {
        "category": "lawn-suits",
        "slug": "floral-lawn-3-piece",
        "name": "Floral Lawn 3-Piece",
        "description": "Printed lawn shirt with matching dupatta and dyed trouser.",
        "image_color": (219, 166, 181),
        "variants": [
            {"sku": "LAWN-FLR-PNK-S", "price": "45.99", "fabric": "lawn", "color": "pink", "size": "S", "stock": 20},
            {"sku": "LAWN-FLR-PNK-M", "price": "45.99", "fabric": "lawn", "color": "pink", "size": "M", "stock": 28},
            {"sku": "LAWN-FLR-MNT-M", "price": "47.99", "fabric": "lawn", "color": "mint", "size": "M", "stock": 14},
        ],
    },
    {
        "category": "lawn-suits",
        "slug": "embroidered-lawn-suit",
        "name": "Embroidered Lawn Suit",
        "description": "Festive lawn suit with neckline embroidery and chiffon dupatta.",
        "image_color": (186, 140, 198),
        "variants": [
            {"sku": "LAWN-EMB-LIL-M", "price": "59.99", "fabric": "lawn", "color": "lilac", "size": "M", "stock": 16},
            {"sku": "LAWN-EMB-LIL-L", "price": "59.99", "fabric": "lawn", "color": "lilac", "size": "L", "stock": 10},
            {"sku": "LAWN-EMB-CRM-M", "price": "57.99", "fabric": "lawn", "color": "cream", "size": "M", "stock": 12},
        ],
    },
    {
        "category": "unstitched-fabric",
        "slug": "premium-lawn-yardage",
        "name": "Premium Lawn Yardage",
        "description": "3-meter premium lawn fabric for custom stitched outfits.",
        "image_color": (120, 178, 210),
        "variants": [
            {"sku": "UNST-LAWN-BLU", "price": "24.99", "fabric": "lawn", "color": "blue", "size": "", "stock": 40},
            {"sku": "UNST-LAWN-GRN", "price": "24.99", "fabric": "lawn", "color": "green", "size": "", "stock": 35},
            {"sku": "UNST-LAWN-RED", "price": "25.99", "fabric": "lawn", "color": "red", "size": "", "stock": 30},
        ],
    },
    {
        "category": "unstitched-fabric",
        "slug": "khaddar-winter-collection",
        "name": "Khaddar Winter Collection",
        "description": "Warm khaddar fabric with subtle weave, perfect for winter suits.",
        "image_color": (94, 108, 132),
        "variants": [
            {"sku": "UNST-KHD-BRN", "price": "32.99", "fabric": "khaddar", "color": "brown", "size": "", "stock": 22},
            {"sku": "UNST-KHD-GRY", "price": "32.99", "fabric": "khaddar", "color": "grey", "size": "", "stock": 18},
        ],
    },
    {
        "category": "shawls-dupattas",
        "slug": "chiffon-embroidered-dupatta",
        "name": "Chiffon Embroidered Dupatta",
        "description": "Soft chiffon dupatta with scalloped embroidery on all sides.",
        "image_color": (230, 200, 168),
        "variants": [
            {"sku": "DUP-CHF-GOLD", "price": "19.99", "fabric": "chiffon", "color": "gold", "size": "", "stock": 45},
            {"sku": "DUP-CHF-IVR", "price": "18.99", "fabric": "chiffon", "color": "ivory", "size": "", "stock": 38},
            {"sku": "DUP-CHF-BLK", "price": "19.99", "fabric": "chiffon", "color": "black", "size": "", "stock": 25},
        ],
    },
    {
        "category": "shawls-dupattas",
        "slug": "pashmina-shawl",
        "name": "Pashmina Shawl",
        "description": "Lightweight pashmina shawl for winter evenings and travel.",
        "image_color": (160, 82, 95),
        "variants": [
            {"sku": "SHL-PSH-WINE", "price": "44.99", "fabric": "pashmina", "color": "wine", "size": "", "stock": 15},
            {"sku": "SHL-PSH-CHAR", "price": "44.99", "fabric": "pashmina", "color": "charcoal", "size": "", "stock": 12},
        ],
    },
    {
        "category": "mens-wear",
        "slug": "classic-shalwar-kameez",
        "name": "Classic Shalwar Kameez",
        "description": "Tailored shalwar kameez in premium blended cotton.",
        "image_color": (72, 108, 152),
        "variants": [
            {"sku": "MEN-SK-WHT-M", "price": "39.99", "fabric": "cotton", "color": "white", "size": "M", "stock": 20},
            {"sku": "MEN-SK-WHT-L", "price": "39.99", "fabric": "cotton", "color": "white", "size": "L", "stock": 16},
            {"sku": "MEN-SK-NVY-L", "price": "41.99", "fabric": "cotton", "color": "navy", "size": "L", "stock": 14},
        ],
    },
    {
        "category": "mens-wear",
        "slug": "waistcoat-velvet",
        "name": "Velvet Waistcoat",
        "description": "Festive velvet waistcoat with front button closure.",
        "image_color": (58, 42, 72),
        "variants": [
            {"sku": "MEN-WC-BLK-M", "price": "54.99", "fabric": "velvet", "color": "black", "size": "M", "stock": 10},
            {"sku": "MEN-WC-BLK-L", "price": "54.99", "fabric": "velvet", "color": "black", "size": "L", "stock": 8},
            {"sku": "MEN-WC-MRN-M", "price": "56.99", "fabric": "velvet", "color": "maroon", "size": "M", "stock": 6},
        ],
    },
    {
        "category": "kurta",
        "slug": "silk-festive-kurta",
        "name": "Silk Festive Kurta",
        "description": "Luxurious silk kurta with minimal gold-tone detailing.",
        "image_color": (198, 156, 72),
        "variants": [
            {"sku": "KURTA-SLK-GLD-M", "price": "79.99", "fabric": "silk", "color": "gold", "size": "M", "stock": 8},
            {"sku": "KURTA-SLK-GLD-L", "price": "79.99", "fabric": "silk", "color": "gold", "size": "L", "stock": 5},
        ],
    },
    {
        "category": "lawn-suits",
        "slug": "sale-lawn-basic",
        "name": "Basic Lawn Suit (Sale)",
        "description": "Entry-level lawn suit at a special promotional price.",
        "image_color": (100, 160, 120),
        "variants": [
            {"sku": "LAWN-SALE-BLU-M", "price": "19.99", "fabric": "lawn", "color": "blue", "size": "M", "stock": 50},
            {"sku": "LAWN-SALE-BLU-L", "price": "19.99", "fabric": "lawn", "color": "blue", "size": "L", "stock": 42},
        ],
    },
]

DEMO_USERS = [
    {
        "email": "demo@example.com",
        "password": "demo12345",
        "first_name": "Ayesha",
        "last_name": "Khan",
        "phone": "+923001234567",
        "is_staff": False,
        "is_superuser": False,
        "addresses": [
            {
                "label": "Home",
                "line1": "House 12, Street 5, DHA Phase 6",
                "line2": "Near commercial market",
                "city": "Karachi",
                "state": "Sindh",
                "postal_code": "75500",
                "country": "PK",
                "is_default": True,
            },
            {
                "label": "Office",
                "line1": "Office 304, Tech Plaza",
                "line2": "",
                "city": "Lahore",
                "state": "Punjab",
                "postal_code": "54000",
                "country": "PK",
                "is_default": False,
            },
        ],
    },
    {
        "email": "admin@example.com",
        "password": "admin12345",
        "first_name": "Admin",
        "last_name": "User",
        "phone": "+923009876543",
        "is_staff": True,
        "is_superuser": True,
        "addresses": [],
    },
]
