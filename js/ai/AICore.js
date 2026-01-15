/**
 * AICore.js - Modular AI Framework
 * Base classes untuk behaviour tree dan FSM
 */

// ============================================
// FINITE STATE MACHINE (FSM)
// ============================================
class StateMachine {
  constructor(initialState) {
    this.currentState = initialState;
    this.states = new Map();
    this.globalTransitions = [];
  }

  addState(name, onEnter, onUpdate, onExit) {
    this.states.set(name, {
      onEnter: onEnter || (() => {}),
      onUpdate: onUpdate || (() => {}),
      onExit: onExit || (() => {})
    });
  }

  addTransition(from, to, condition) {
    if (!this.states.has(from)) {
      console.warn(`State ${from} not found`);
      return;
    }
    
    const state = this.states.get(from);
    if (!state.transitions) state.transitions = [];
    state.transitions.push({ to, condition });
  }

  // Transisi yang bisa terjadi dari state mana pun
  addGlobalTransition(to, condition, priority = 0) {
    this.globalTransitions.push({ to, condition, priority });
    this.globalTransitions.sort((a, b) => b.priority - a.priority);
  }

  update(entity, game) {
    // Check global transitions first (high priority)
    for (let t of this.globalTransitions) {
      if (t.condition(entity, game)) {
        this.changeState(t.to, entity, game);
        break;
      }
    }

    const state = this.states.get(this.currentState);
    if (!state) return;

    // Update current state
    state.onUpdate(entity, game);

    // Check state-specific transitions
    if (state.transitions) {
      for (let t of state.transitions) {
        if (t.condition(entity, game)) {
          this.changeState(t.to, entity, game);
          break;
        }
      }
    }
  }

  changeState(newState, entity, game) {
    if (this.currentState === newState) return;
    
    const oldState = this.states.get(this.currentState);
    const nextState = this.states.get(newState);
    
    if (!nextState) {
      console.warn(`State ${newState} not found`);
      return;
    }

    if (oldState) oldState.onExit(entity, game);
    
    this.currentState = newState;
    nextState.onEnter(entity, game);
  }

  getState() {
    return this.currentState;
  }
}

// ============================================
// BEHAVIOUR TREE NODES
// ============================================
class BTNode {
  constructor() {
    this.status = 'running'; // 'success', 'failure', 'running'
  }

  tick(entity, game) {
    throw new Error('BTNode.tick() must be implemented');
  }

  reset() {
    this.status = 'running';
  }
}

// Selector: Jalankan anak hingga ada yang berhasil (OR logic)
class BTSelector extends BTNode {
  constructor(children = []) {
    super();
    this.children = children;
    this.currentChild = 0;
  }

  tick(entity, game) {
    while (this.currentChild < this.children.length) {
      const child = this.children[this.currentChild];
      child.tick(entity, game);

      if (child.status === 'running') {
        this.status = 'running';
        return;
      }
      
      if (child.status === 'success') {
        this.reset();
        this.status = 'success';
        return;
      }

      this.currentChild++;
    }

    this.reset();
    this.status = 'failure';
  }

  reset() {
    this.currentChild = 0;
    this.children.forEach(c => c.reset());
  }
}

// Sequence: Jalankan anak hingga semua berhasil (AND logic)
class BTSequence extends BTNode {
  constructor(children = []) {
    super();
    this.children = children;
    this.currentChild = 0;
  }

  tick(entity, game) {
    while (this.currentChild < this.children.length) {
      const child = this.children[this.currentChild];
      child.tick(entity, game);

      if (child.status === 'running') {
        this.status = 'running';
        return;
      }
      
      if (child.status === 'failure') {
        this.reset();
        this.status = 'failure';
        return;
      }

      this.currentChild++;
    }

    this.reset();
    this.status = 'success';
  }

  reset() {
    this.currentChild = 0;
    this.children.forEach(c => c.reset());
  }
}

// Condition: Check boolean
class BTCondition extends BTNode {
  constructor(checkFn) {
    super();
    this.checkFn = checkFn;
  }

  tick(entity, game) {
    this.status = this.checkFn(entity, game) ? 'success' : 'failure';
  }
}

// Action: Execute function
class BTAction extends BTNode {
  constructor(actionFn) {
    super();
    this.actionFn = actionFn;
  }

  tick(entity, game) {
    this.status = this.actionFn(entity, game);
  }
}

// ============================================
// DECISION UTILITY SYSTEM
// ============================================
class UtilityAI {
  constructor() {
    this.considerations = [];
  }

  addConsideration(name, scoreFn, weight = 1.0) {
    this.considerations.push({ name, scoreFn, weight });
  }

  evaluate(entity, game, options) {
    let bestOption = null;
    let bestScore = -Infinity;

    for (let option of options) {
      let totalScore = 0;
      let totalWeight = 0;

      for (let consideration of this.considerations) {
        const score = consideration.scoreFn(entity, game, option);
        totalScore += score * consideration.weight;
        totalWeight += consideration.weight;
      }

      const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestOption = option;
      }
    }

    return { option: bestOption, score: bestScore };
  }
}

// ============================================
// BLACKBOARD - Shared Memory
// ============================================
class Blackboard {
  constructor() {
    this.data = new Map();
  }

  set(key, value) {
    this.data.set(key, value);
  }

  get(key, defaultValue = null) {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

// Export untuk digunakan file lain
if (typeof window !== 'undefined') {
  window.AICore = {
    StateMachine,
    BTNode,
    BTSelector,
    BTSequence,
    BTCondition,
    BTAction,
    UtilityAI,
    Blackboard
  };
}