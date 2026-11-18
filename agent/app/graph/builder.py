from langgraph.graph import StateGraph, START, END

from app.graph.state import DispatchState
from app.graph.nodes.parse_order import parse_node
from app.graph.nodes.score_candidates import rank_node
from app.graph.nodes.decide import decide_node


def _start(state):
    return "rank" if state.get("order") else "parse"


def _after_parse(state):
    return "end" if state.get("status") == "needs_clarification" else "rank"


def _after_rank(state):
    return "decide" if state.get("status") == "ranked" else "end"


g = StateGraph(DispatchState)
g.add_node("parse", parse_node)
g.add_node("rank", rank_node)
g.add_node("decide", decide_node)

g.add_conditional_edges(START, _start, {"parse": "parse", "rank": "rank"})
g.add_conditional_edges("parse", _after_parse, {"rank": "rank", "end": END})
g.add_conditional_edges("rank", _after_rank, {"decide": "decide", "end": END})
g.add_edge("decide", END)

dispatch_graph = g.compile()