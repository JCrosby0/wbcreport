import { PlayerRecord } from "./playerRecord";

export class OutstandingRow {
  Team: string;
  Player: string;
  Registered: boolean;
  Balance: number;

  constructor(team: string, playerRecord: PlayerRecord) {
    this.Team = team;
    this.Player = playerRecord.name;
    this.Registered = !!playerRecord.registered;
    this.Balance = playerRecord.balanceBaseball + playerRecord.balanceSoftball;
  }
}
