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
      // content:`AB: 0 1\ni: x\nf: x1010\nx 0 x\nx 1 x x1\nx1 0 x10\nx1 1\nx10 0\nx10 1 x101\nx101 0 x1010\n x101 1\nx1010 0\nx1010 1`
      content: `AB: a b c\ni: 1 2 3\nf: 3\n1 a 2\n1 b\n1 c\n2 a 2\n2 b\n2 c 2 3\n3 a 3 2\n3 b\n3 c`
    },
    {
      title:'Exemplo 2 AFN',
      name:'exemplo2',
      content:`AB: a b\ni: 0\nf: 0 1\n0 a 1 2\n0 b \n1 a 1 2\n1 b \n2 a \n2 b 1 3\n3 a 1 2\n3 b`
    },
    {
      title:'Exemplo 3 AFN',
      name:'exemplo3',
      content:`AB: 0 1\ni: A B\nf: D\nA 0 D C\nA 1 \nB 0 \nB 1 D\nC 0 \nC 1 B A\nD 0 B\nD 1`
    },
    {
      title:'Exemplo 4 AFN',
      name:'exemplo4',
      content:`AB: a b c d\ni: 1 3\nf: 2\n1 a 1\n1 b 1 2\n1 c \n1 d \n2 a \n2 b \n2 c 2\n2 d \n3 a 3\n3 b \n3 c \n3 d 2 3`
    }
  ]

  // AFN PROPERTIES
  private afnLines;
  private afnStates;
  private afnAlphabet;
  private afnStructure(afn:string,separator:'\n'){
    let lines:Array<string> = afn.split(separator)
    .map((line)=>{return line.trim()})
    .filter((line)=>{
      return line.length > 0;
    });
    return lines;
  }
  private getAFNAlphabet(afnLines:Array<string>){
    let split = afnLines[0].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getAFNInitialStates(afnLines:Array<string>){
    let split = afnLines[1].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getAFNFinalStates(afnLines:Array<string>){
    let split = afnLines[2].split(" ");
    split = split.slice(1,);
    return split;
  }
  private getAFNStates(afnLines:Array<string>){
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
      state.length == 0 ? states.push({name:stateName,transitions:[{consume:consume,goTo:goTo != null? goTo.sort():null}]})
                        : states.forEach((state)=>{
                          if (state.name == stateName){
                            state.transitions.push({consume:consume,goTo:goTo != null? goTo.sort():null});
                          }
                        })
    }
    return states;
  }
  private getAFNState(afnStates:Array<AutomataState>,stateName:string){
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
  public AFDOutput = "";

  private getAFDFinalState(afdStates:Array<AutomataState>,afnFinalStates){
    //loop through afdStates, split in ',', loop through
    let isFinal = false;
    let finalStates = [];
    for (let afdState of afdStates){
      for (let state of afdState.name.split(",")){
        //loop through afnInitialStates
        for (let afnState of afnFinalStates){
          if (state == afnState){
            isFinal = true;
          }
        }
      }
      if (isFinal){
        finalStates.push(afdState.name);
        isFinal = false;
      }
    }
    return finalStates;
  }

  private getAFDInitialState(afnInitialState){
    return afnInitialState.sort().join();
  }
  private isStateInDeltaList(deltaList:Array<string>,state:string){
    return deltaList.indexOf(state) != -1 ? true:false;
  }
  private afdFirstState (state:AutomataState,afdInitialState:string):AutomataState{
    // used for deep cloning objects and making them separate from original source
    let _state = JSON.parse(JSON.stringify(state));
    // _state.name = Array.isArray(_state.name) ? _state.join() : _state.name;
    _state.name = afdInitialState;
    for (let transition in _state.transitions){
      _state.transitions[transition].goTo = Array.isArray(_state.transitions[transition].goTo)
        ? _state.transitions[transition].goTo.sort().join()
        : null;
    }
    return _state;
  }
  private buildInitialDeltaList(afdState:AutomataState,deltaList:Array<string>){
    let copyAfdState = JSON.parse(JSON.stringify(afdState));
    deltaList.push(copyAfdState.name);
    for (let transition of copyAfdState.transitions){
      if (Array.isArray(transition.goTo)){
        if (!this.isStateInDeltaList(deltaList,transition.goTo.sort().join()) && transition.goTo.join() != ""){
          deltaList.push(transition.goTo.sort().join());
        }
      }
    }
  }
  private removeDuplicateStates(states:Array<string>){
    let join = states.sort().join();
    let set:any = new Set(join.split(",")).values();
    // we had to use Array.from(set) here because of TypeScript approach to spread operators
    // for now it only accepts iterators from an Array
    return  [...Array.from(set)].join();
  }
  private createAFDTransitions (afnStates:Array<AutomataState>,alphabet:Array<string>,afnInitialStates:Array<string>){
    let afdStates = [] // we use the first state of the automata as initial input
    let deltaList = []; // delta list of states
    let initialDeltaList = 0;
   // check if there's more than one initial state on the AFN
    if(afnInitialStates.length > 1){
      deltaList.push(afnInitialStates.sort().join());
    }else{
      // for one initial state:
      afdStates.push(this.afdFirstState(afnStates[0],afnStates[0].name));
      this.buildInitialDeltaList(afnStates[0],deltaList);
      initialDeltaList = 1;
    }

    for (let i = initialDeltaList; i < deltaList.length;i++){
      // we have to mount the object's transitions
      let newState    = {name:deltaList[i],transitions:[]};

      for (let item of alphabet.sort()){
        let goTo      = [];
        let newGoTo = ""; // this goTo is to make sure we don't have this situation: 2,2,3
        for (let state of deltaList[i].split(",").sort()){
          let afnGoTo = this.getStateGoTo(afnStates,state,item)
          // console.log("afnGoTo: ",afnGoTo);
          if(afnGoTo != null){
            // we can't add duplicate states in the same states array
            let filter = goTo.filter((v)=>{return v == afnGoTo});
            if (filter.length == 0){goTo.push(afnGoTo)};
          };
          // console.log("getStateGoTo: ",this.getStateGoTo(afnStates,state,item));
        }
        // we need to prevent states that are duplicate in different transitions like: ["2","2,3"]
        // we join => 2,2,3, then split again => new Set(["2","2","3"])
        if (goTo.sort().join() != ""){
          newGoTo = this.removeDuplicateStates(goTo);
        }
        if(!this.isStateInDeltaList(deltaList,newGoTo) && goTo.sort().join() != ""){
          deltaList.push(newGoTo)
        }
        // if goTo.join() is "" we should push 'null' instead
        const checkGoTo = newGoTo == "" ? null : newGoTo;
        newState.transitions.push({consume:item,goTo:checkGoTo});
        // console.log("NewState: ",newState);
      }
      afdStates.push(newState);
    }
    // console.log("AFD States: ",afdStates);
    // console.log("Delta List After: ",deltaList);
    return afdStates;
  }

  private createAFDOutput(afdStates:Array<AutomataState>,alphabet:Array<string>,initialStates:Array<string>,finalStates:Array<string>){
    let output = "";
    // alphabet
    output+=`AB: ${alphabet.join().replace(","," ")}\n`;
    // initial states
    output += `i: ${initialStates}\n`;
    // final states
    output += `f: `;
    finalStates.forEach((state)=>{
      output += `${state} `;
    })
    output+='\n';
    for (let state of afdStates){
      for (let transition of state.transitions){
        output+= `${state.name} ${transition.consume} ${transition.goTo == null?'':transition.goTo}`;
        output+="\n";
      }
    }
    return output;
  }

  private translateAutomata(afnText:string){
    this.afnLines = this.afnStructure(afnText,'\n');
    this.afnStates = this.getAFNStates(this.afnLines);
    let alphabet = this.getAFNAlphabet(this.afnLines);
    let afnInitials = this.getAFNInitialStates(this.afnLines);
    let afnFinals = this.getAFNFinalStates(this.afnLines);
    let afdInitials = this.getAFDInitialState(afnInitials);
    let afdStates = this.createAFDTransitions(this.afnStates,this.getAFNAlphabet(this.afnLines),afnInitials);
    let afdFinals = this.getAFDFinalState(afdStates,afnFinals);
    this.AFDOutput = this.createAFDOutput(afdStates,alphabet,afdInitials,afdFinals);
    console.log("Alphabet: ",alphabet);
    console.log("AFN Initial: ",afnInitials);
    console.log("AFN Final: ",afnFinals);
    console.log("AFN States: ",this.afnStates);

    console.log("AFD Initial State: ",afdInitials);
    console.log("AFD Final States: ",afdFinals)
    console.log("AFD States: ",afdStates);
    console.log("Output: ");
    console.log(this.AFDOutput);

    this.afdForm.controls.afd.setValue(this.AFDOutput);
  }

  public AutomataForm:FormGroup;
  public afdForm:FormGroup;
  constructor(private fb:FormBuilder){
    this.AutomataForm = this.fb.group({afn:''});
    this.afdForm = this.fb.group({afd:''});
  }
  ngOnInit(){


    // this.afnForm.controls.afn.valueChanges
    // .debounceTime(500)
    // .subscribe((value)=>{
    //   this.afnLines = this.afnStructure(value,'\n');
    //   this.afnStates = this.getAFNStates(this.afnLines);
    //   let alphabet = this.getAFNAlphabet(this.afnLines);
    //   let afnInitials = this.getAFNInitialStates(this.afnLines);
    //   let afnFinals = this.getAFNFinalStates(this.afnLines);
    //   let afdInitials = this.getAFDInitialState(afnInitials);
    //   let afdStates = this.createAFDTransitions(this.afnStates,this.getAFNAlphabet(this.afnLines),afnInitials);
    //   let afdFinals = this.getAFDFinalState(afdStates,afnFinals);
    //   this.AFDOutput = this.createAFDOutput(afdStates,alphabet,afdInitials,afdFinals);
    //   console.log("Alphabet: ",alphabet);
    //   console.log("AFN Initial: ",afnInitials);
    //   console.log("AFN Final: ",afnFinals);
    //   console.log("AFN States: ",this.afnStates);

    //   console.log("AFD Initial State: ",afdInitials);
    //   console.log("AFD Final States: ",afdFinals)
    //   console.log("AFD States: ",afdStates);
    //   console.log("Output: ");

    //   console.log(this.AFDOutput);
    // })
  }
  useThis(content:string){
    // make afn receive content
    this.AutomataForm.controls.afn.setValue(content);
    if (this.AFDOutput.length > 0){
      this.afdForm.controls.afd.setValue("");
      this.AFDOutput = "";
    }
  }
}
