import { ID } from "shared-types";
import { RoomFeature } from "shared-types";

export class RoomFeatureModel implements RoomFeature {
  id?: ID;
  description?: string;
  IsIncluded: boolean;
  additionalCost: number;

   constructor(params: {
    id?:ID;
    description?: string;
    IsIncluded: boolean;
    additionalCost: number;
   }) {
    this.id = params.id?? crypto.randomUUID();;
    this.description = params.description;
    this.IsIncluded = params.IsIncluded;
    this.additionalCost = params.additionalCost; 
   }

  toDatabaseFormat() {
    return {
      description: this.description,
      isincluded: this.IsIncluded,
      additional_cost: this.additionalCost
    };
  }
      static fromDatabaseFormat(dbData: any): RoomFeatureModel {
        return new RoomFeatureModel({
            id: dbData.id,
            description: dbData.description,
            IsIncluded: dbData.isincluded,
            additionalCost: dbData.additional_cost
        });
    }
    static fromDatabaseFormatArray(dbDataArray: any[] ): RoomFeatureModel[] {
        return dbDataArray.map(dbData => RoomFeatureModel.fromDatabaseFormat(dbData));
    }
}