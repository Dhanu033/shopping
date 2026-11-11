export interface TasselPiece {
  id: string;
  name: string;
  price: string;
  image: string;
  description?: string;
  category?: 'kuchu' | 'latkan' | 'belt' | 'pallu' | 'crochet';
}

export interface ArtisanDetails {
  craftsmanship: string;
  artisanHours: number;
  silkType: string;
  embellishments: string;
  tasselLengths: string[];
}

export interface SareeLook {
  id: string;
  lookNumber: number;
  title: string;
  collection: string;
  sareeFabric: string;
  description: string;
  modelImage: string;
  aspectRatio?: number; // width / height
  pieces: [TasselPiece, TasselPiece];
  artisanDetails: ArtisanDetails;
}

export interface CartItem {
  id: string;
  lookNumber: number;
  lookTitle: string;
  pieceName: string;
  price: string;
  numericPrice: number;
  image: string;
  quantity: number;
  selectedLength?: string;
}
