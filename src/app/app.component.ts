import { Component,OnInit, transition } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AutomataState } from '../models/automata-state.model';

import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  public exemplos = [
    {
      title:'Exemplo 1 AFN',
      name:'exemplo1',
      content:`AB: 0 1\ni: x\nf: x1010\nx 0 x\nx 1 x x1\nx1 0 x10\nx1 1\nx10 0\nx10 1 x101\nx101 0 x1010\n x101 1\nx1010 0\nx1010 1`
    },
    {
      title:'Exemplo 2 AFN',
      name:'exemplo2',
      content:`AB: a b\ni: 0\nf: 0 1\n0 a 1 2\n0 b \n1 a 1 2\n1 b \n2 a \n2 b 1 3\n3 a 1 2\n3 b`
    },
    {
      title:'Exemplo 3 AFN',
      name:'exemplo3',
      content:'Transições do exemplo 3 aqui'
    }
  ]

  // AFN PROPERTIES
  private afnLines;
  private afnStates;
  private afnAlphabet;
  public afnForm:FormGroup;
  private afnStructure(afn:string,separator:'\n'){
    let lines:Array<string> = afn.split(separator)
    .map((line)=>{return line.trim()})
    .filter((line)=>{
      return line.length > 0;
    });
    return lines;
  }
  private getAlphabet(afnLines:Array<string>){
    let split = afnLines[0].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getInitialStates(afnLines:Array<string>){
    let split = afnLines[1].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getFinalStates(afnLines:Array<string>){
    let split = afnLines[2].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getStates(afnLines:Array<string>){
    let states:Array<AutomataState> = [];
    for (let i = 3;i < afnLines.length;i++){
      let stateName,consume,goTo;
      let line  = afnLines[i].split(" ");
      stateName = line[0];
      consume   =  line[1];
      goTo      = line.slice(2,).length > 0 ? line.slice(2,) : null;
      // console.log(`Statename: ${stateName}, consume: ${consume}, goTo: ${goTo}`);
      // check if state already exists
      let state = states.filter((state)=>{return state.name == stateName});
      // console.log("State exist? Prove: ",state);
      state.length == 0 ? states.push({name:stateName,transitions:[{consume:consume,goTo:goTo}]})
                        : states.forEach((state)=>{
                          if (state.name == stateName){
                            state.transitions.push({consume:consume,goTo:goTo});
                          }
                        })
    }
    return states;
  }
  private getState(afnStates:Array<AutomataState>,stateName:string){
    for (let state of afnStates){
      if (state.name == stateName){
        return state;
      }
    }
    return null;
  }
  private getStateGoTo(afnStates:Array<AutomataState>,stateName:string,alphabetItem:string){
    
    for (let state of afnStates){
      if (state.name == stateName){
        let filter = state.transitions
        .filter((transition)=>{
          return alphabetItem == transition.consume
        })
        if (filter[0].goTo != null){
          return filter[0].goTo.join();
        }
        return null;
      }
    }
    return null; // if not found
  }
  // AFD PROPERTIES
  
  private isStateInDeltaList(deltaList:Array<string>,state:string){
    return deltaList.indexOf(state) != -1 ? true:false;
  }
  private afdFirstState (state:AutomataState):AutomataState{
    // used for deep cloning objects and making them separate from original source
    let _state = JSON.parse(JSON.stringify(state));
    _state.name = Array.isArray(_state.name) ? _state.join() : _state.name;
    for (let transition in _state.transitions.slice(0)){
      _state.transitions[transition].goTo = Array.isArray(_state.transitions[transition].goTo)  
        ? _state.transitions[transition].goTo.join() 
        : null;
    }
    return _state;
  }
  private buildInitialDeltaList(afdState:AutomataState,deltaList:Array<string>){
    let copyAfdState = JSON.parse(JSON.stringify(afdState));
    deltaList.push(copyAfdState.name);
    for (let transition of copyAfdState.transitions){
      if (Array.isArray(transition.goTo)){
        if (!this.isStateInDeltaList(deltaList,transition.goTo.join()) && transition.goTo.join() != ""){
          deltaList.push(transition.goTo.join());
        }
      }
    }
  }
  private createAFDTransitions (afnStates:Array<AutomataState>,alphabet:Array<string>){
    let afdStates = [this.afdFirstState(afnStates[0])] // we use the first state of the automata as initial input
    let deltaList = []; // delta list of states
    this.buildInitialDeltaList(afnStates[0],deltaList);
    // loop over afnStates
      // loop over state transitions
        // check if transition is already in deltaList
          // if YES => Jump to next state
          // if NO  =>  - Add to deltaList
          //            - Join the transition to add to the state name
          //            - 
    // console.log("Delta List before: ",deltaList);

    for (let i = 1; i < deltaList.length;i++){
      // we have to mount the object's transitions
      let newState    = {name:deltaList[i],transitions:[]};
      for (let item of alphabet){
        let goTo      = [];
        for (let state of deltaList[i].split(",")){
          let afnGoTo = this.getStateGoTo(afnStates,state,item)
          // console.log("afnGoTo: ",afnGoTo);
          if(afnGoTo != null){ 
            // we can't add duplicate states
            let filter = goTo.filter((v)=>{return v == afnGoTo});
            if (filter.length == 0){goTo.push(afnGoTo)};
          };
          // console.log("getStateGoTo: ",this.getStateGoTo(afnStates,state,item));
        }
        // console.log("GoTo.join(): ",goTo.join());
        if(!this.isStateInDeltaList(deltaList,goTo.join()) && goTo.join() != ""){ 
          deltaList.push(goTo.join()) 
        }
        // if goTo.join() is "" we should push 'null' instead
        const checkGoTo = goTo.join() == "" ? null : goTo.join();
        newState.transitions.push({consume:item,goTo:checkGoTo});
        // console.log("NewState: ",newState);
      }
      afdStates.push(newState);
    }
    // console.log("AFD States: ",afdStates);
    // console.log("Delta List After: ",deltaList);
    return afdStates;
  }
  // private createAFDInitialState ()
  // private createAFDFinalState(afnFinalStates)

  constructor(private fb:FormBuilder){
    this.afnForm = this.fb.group({afn:''});
  }  
  ngOnInit(){
    
    
    this.afnForm.controls.afn.valueChanges
    .debounceTime(500)
    .subscribe((value)=>{
      this.afnLines = this.afnStructure(value,'\n');
    this.afnStates = this.getStates(this.afnLines);
    console.log("Alphabet: ",this.getAlphabet(this.afnLines));
    console.log("AFN Initial: ",this.getInitialStates(this.afnLines));
    console.log("AFN Final: ",this.getFinalStates(this.afnLines));
    console.log("AFN States: ",this.afnStates);
    console.log("AFD States: ",this.createAFDTransitions(this.afnStates,this.getAlphabet(this.afnLines)));
    })
  }
  useThis(content:string){
    // make afn receive content
    this.afnForm.controls.afn.setValue(content);
  }
}
