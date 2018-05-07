export interface AutomataState{
  name:string,
  transitions:[{consume:string,goTo:Array<string>}] | any
}