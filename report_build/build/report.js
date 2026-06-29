const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak,
  TableOfContents, ExternalHyperlink, PageNumber,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  HorizontalPositionAlign, VerticalPositionAlign, TextWrappingType,
} = require("docx");

const ASSETS = path.join(__dirname, "..", "assets");
const img = (f) => fs.readFileSync(path.join(ASSETS, f));

// ---- palette / sizing ----
const NAVY = "1F3864";
const NAVY2 = "2E4D7B";
const LIGHT = "D9E2F3";
const GREY = "595959";
const CONTENT_W = 10080; // 12240 - 1080 - 1080

// ===== reusable image blocks =====
function bannerImage() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new ImageRun({
      type: "png", data: img("image1.png"),
      transformation: { width: 672, height: 90 },
      altText: { title: "RVCE", description: "RV College of Engineering", name: "banner" },
    })],
  });
}
function centerLogo(w = 300) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new ImageRun({
      type: "png", data: img("image6.png"),
      transformation: { width: w, height: Math.round(w * 487 / 1192) },
      altText: { title: "RVCE", description: "RV College of Engineering", name: "logo" },
    })],
  });
}
function watermarkHeader() {
  return new Header({
    children: [new Paragraph({
      children: [new ImageRun({
        type: "jpg", data: img("image2.jpeg"),
        transformation: { width: 300, height: 300 },
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, align: HorizontalPositionAlign.CENTER },
          verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, align: VerticalPositionAlign.CENTER },
          behindDocument: true, allowOverlap: true,
          wrap: { type: TextWrappingType.NONE },
        },
        altText: { title: "watermark", description: "RV watermark", name: "wm" },
      })],
    })],
  });
}
function footerBanner() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        type: "png", data: img("image4.png"),
        transformation: { width: 672, height: 28 },
        altText: { title: "RSST", description: "Go change the world", name: "footer" },
      })],
    })],
  });
}

// ===== text helpers =====
function P(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, size: opts.size || 22 })];
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after != null ? opts.after : 140, line: 276, ...(opts.before ? { before: opts.before } : {}) },
    indent: opts.indent,
    children: runs,
  });
}
function run(text, o = {}) { return new TextRun({ text, size: o.size || 22, bold: o.bold, italics: o.i, color: o.color, font: o.font }); }

function H1(text, bookmark) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, bold: true, size: 30, color: NAVY })],
  });
}
function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 25, color: NAVY2 })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 90, line: 270 },
    children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })],
  });
}
function numItem(text, ref = "nums") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 90, line: 270 },
    children: Array.isArray(text) ? text : [new TextRun({ text, size: 22 })],
  });
}
function spacer(h = 120) { return new Paragraph({ spacing: { after: h }, children: [new TextRun("")] }); }

// ===== table helpers =====
const B = { style: BorderStyle.SINGLE, size: 4, color: "AAB4C8" };
const BORDERS = { top: B, bottom: B, left: B, right: B, insideHorizontal: B, insideVertical: B };
function cell(content, { w, head, shade, align, bold } = {}) {
  const kids = (Array.isArray(content) ? content : [content]).map((t) =>
    typeof t === "string"
      ? new Paragraph({ alignment: align || AlignmentType.LEFT, spacing: { after: 0, line: 264 },
          children: [new TextRun({ text: t, bold: head || bold, size: 20, color: head ? "FFFFFF" : "000000" })] })
      : t);
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: head ? NAVY : (shade || "FFFFFF"), type: ShadingType.CLEAR },
    children: kids,
  });
}
function table(widths, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: BORDERS,
    rows,
  });
}

// =========================================================================
//  TITLE PAGE
// =========================================================================
const TITLE = "Friend Graph Explorer: An Optimized Friends-of-Friends Recommendation Engine and a Comparative Study with Industry-Standard Social-Network Algorithms";

const titlePage = [
  bannerImage(),
  P([run("DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING", { bold: true, size: 26, color: NAVY })], { align: AlignmentType.CENTER, after: 240 }),
  P([run(TITLE, { bold: true, size: 30, color: NAVY })], { align: AlignmentType.CENTER, after: 200 }),
  P([run("REPORT", { bold: true, size: 28 })], { align: AlignmentType.CENTER, after: 80 }),
  P([run("Design and Analysis of Algorithms – CD343AI", { i: true, size: 22 })], { align: AlignmentType.CENTER, after: 0 }),
  P([run("Experiential Learning (Lab)", { i: true, size: 22 })], { align: AlignmentType.CENTER, after: 160 }),
  P([run("Submitted by", { i: true, size: 24 })], { align: AlignmentType.CENTER, after: 100 }),
  table([3600, 2400], [
    new TableRow({ children: [cell("Shlok", { w: 3600, bold: true, align: AlignmentType.CENTER }), cell("1RV24IS038", { w: 2400, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [cell("Karthik Anup Revankar", { w: 3600, bold: true, align: AlignmentType.CENTER }), cell("1RV24IS053", { w: 2400, align: AlignmentType.CENTER })] }),
  ]),
  spacer(160),
  P([run("Under the guidance of", { i: true, size: 24 })], { align: AlignmentType.CENTER, after: 60 }),
  P([run("[ Name of the Guide ]", { bold: true, size: 24 })], { align: AlignmentType.CENTER, after: 40 }),
  P([run("Department of Information Science and Engineering", { size: 22 })], { align: AlignmentType.CENTER, after: 200 }),
  P([run("In partial fulfilment for the award of degree of", { size: 22 })], { align: AlignmentType.CENTER, after: 40 }),
  P([run("Bachelor of Engineering", { bold: true, size: 24 })], { align: AlignmentType.CENTER, after: 20 }),
  P([run("in", { i: true, size: 22 })], { align: AlignmentType.CENTER, after: 20 }),
  P([run("Information Science and Engineering", { bold: true, size: 22 })], { align: AlignmentType.CENTER, after: 160 }),
  centerLogo(150),
  P([run("RV College of Engineering®, Bengaluru – 560059", { bold: true, size: 22, color: NAVY })], { align: AlignmentType.CENTER, after: 20 }),
  P([run("(Autonomous Institution Affiliated to Visvesvaraya Technological University, Belagavi)", { size: 20 })], { align: AlignmentType.CENTER, after: 120 }),
  P([run("2025 – 2026", { bold: true, size: 24 })], { align: AlignmentType.CENTER, after: 0 }),
];

// =========================================================================
//  CERTIFICATE
// =========================================================================
const certPage = [
  centerLogo(150),
  P([run("RV College of Engineering®, Bengaluru – 560059", { bold: true, size: 22, color: NAVY })], { align: AlignmentType.CENTER, after: 20 }),
  P([run("Department of Information Science and Engineering", { bold: true, size: 22, color: NAVY })], { align: AlignmentType.CENTER, after: 160 }),
  P([run("CERTIFICATE", { bold: true, size: 30, color: NAVY })], { align: AlignmentType.CENTER, after: 200 }),
  P([
    run("Certified that the project work titled ", {}),
    run("'Friend Graph Explorer: An Optimized Friends-of-Friends Recommendation Engine'", { i: true, bold: true }),
    run(" is carried out by ", {}),
    run("Shlok (1RV24IS038)", { bold: true }),
    run(" and ", {}),
    run("Karthik Anup Revankar (1RV24IS053)", { bold: true }),
    run(", who are bonafide students of RV College of Engineering, Bengaluru, in partial fulfilment for the award of degree of ", {}),
    run("Bachelor of Engineering in Information Science and Engineering", { bold: true }),
    run(" of the ", {}),
    run("Visvesvaraya Technological University", { bold: true }),
    run(", Belagavi during the academic year 2025-2026. It is certified that all corrections/suggestions indicated for the Internal Assessment have been incorporated in the report deposited in the departmental library. The report has been approved as it satisfies the academic requirements in respect of experiential learning work prescribed by the institution for the said degree.", {}),
  ], { after: 360 }),
  spacer(240),
  table([3360, 3360, 3360], [
    new TableRow({ children: [
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Signature of Guide", bold: true, size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Signature of Head of the Department", bold: true, size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Signature of Principal", bold: true, size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
    ] }),
    new TableRow({ children: [
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "[ Name of the Guide ]", size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dr. G S Mamatha", size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dr. K N Subramanya", size: 20 })] })], { w: 3360, align: AlignmentType.CENTER }),
    ] }),
  ]),
  spacer(280),
  P([run("External Viva", { bold: true, size: 24, color: NAVY })], { align: AlignmentType.CENTER, after: 120 }),
  table([5040, 5040], [
    new TableRow({ children: [cell("Name of Examiners", { w: 5040, head: true }), cell("Signature with Date", { w: 5040, head: true })] }),
    new TableRow({ children: [cell("1.", { w: 5040 }), cell(" ", { w: 5040 })] }),
    new TableRow({ children: [cell("2.", { w: 5040 }), cell(" ", { w: 5040 })] }),
  ]),
];

// =========================================================================
//  DECLARATION
// =========================================================================
const declPage = [
  P([run("DECLARATION", { bold: true, size: 30, color: NAVY })], { align: AlignmentType.CENTER, after: 240 }),
  P([
    run("We, ", {}),
    run("Shlok (1RV24IS038)", { bold: true }),
    run(" and ", {}),
    run("Karthik Anup Revankar (1RV24IS053)", { bold: true }),
    run(", students of Fourth Semester B.E., Department of Information Science and Engineering, RV College of Engineering, Bengaluru, hereby declare that the Experiential Learning (Lab) titled ", {}),
    run("'Friend Graph Explorer: An Optimized Friends-of-Friends Recommendation Engine'", { i: true, bold: true }),
    run(" has been carried out by us and submitted in partial fulfilment for the award of degree of ", {}),
    run("Bachelor of Engineering in Information Science and Engineering", { bold: true }),
    run(" during the academic year 2025-26.", {}),
  ], { after: 200 }),
  P("We also declare that any Intellectual Property Rights generated out of this project carried out at RVCE will be the property of RV College of Engineering®, Bengaluru, and we will be one of the authors of the same.", { after: 280 }),
  P([run("Place: Bengaluru", { size: 22 })], { align: AlignmentType.LEFT, after: 40 }),
  P([run("Date:", { size: 22 })], { align: AlignmentType.LEFT, after: 280 }),
  table([1200, 4800, 3600], [
    new TableRow({ children: [cell("Sl. No.", { w: 1200, head: true, align: AlignmentType.CENTER }), cell("Name (USN)", { w: 4800, head: true }), cell("Signature", { w: 3600, head: true })] }),
    new TableRow({ children: [cell("1.", { w: 1200, align: AlignmentType.CENTER }), cell("Shlok (1RV24IS038)", { w: 4800 }), cell(" ", { w: 3600 })] }),
    new TableRow({ children: [cell("2.", { w: 1200, align: AlignmentType.CENTER }), cell("Karthik Anup Revankar (1RV24IS053)", { w: 4800 }), cell(" ", { w: 3600 })] }),
  ]),
];

// =========================================================================
//  ABSTRACT
// =========================================================================
const abstractPage = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "Abstract", bold: true, size: 30, color: NAVY })] }),
  P("Social networking platforms such as Facebook, Instagram and LinkedIn rely heavily on a friend (or connection) recommendation engine to grow and sustain user engagement. At the heart of these systems lies a graph in which users are vertices and relationships are edges, and the recommendation task reduces to predicting links that are likely to form. This project, Friend Graph Explorer, models a social network as an undirected graph using an adjacency-list representation and generates friend recommendations using a depth-limited Breadth-First Search that surfaces 'friends-of-friends' ranked by the number of mutual connections. The objective is to design a recommendation procedure that is provably efficient on sparse, large-scale graphs and to demonstrate, through a live benchmark, that it outperforms the naive whole-graph traversal techniques commonly taught and used as baselines."),
  P("The core of the work is the detailed design and justification of the recommendation algorithm. Because a friendship recommendation is an inherently local query, the proposed algorithm restricts traversal to distance two from the source vertex, achieving a running time of O(k²) where k is the user's degree, independent of the total number of users V. Candidate generation uses hash-Set based de-duplication for O(1) membership tests, and candidates are ranked by mutual-friend count, an instantiation of the triadic-closure principle that also underpins Facebook's 'People You May Know' and LinkedIn's connection recommender. This design is contrasted with adjacency-matrix and full BFS/DFS baselines that cost O(V²) space or O(V + E) time per query."),
  P("A functional prototype was developed as an interactive single-page web application (React, TypeScript and Vite) featuring graph visualisation, an adjacency-matrix view and a dedicated benchmarking module. The benchmark generates realistic scale-free networks of up to 10,000 users using the Barabási–Albert model and times every algorithm in-browser with performance.now(). On a 10,000-user network the optimized algorithm answered recommendation queries in approximately 15 microseconds each (about 65,000 queries/second), running roughly 54× faster than the brute-force adjacency-matrix approach and several times faster than full BFS/DFS, while an animated simulation showed it touching only about 7% of the network versus 100% for the baselines."),
  P("In conclusion, the project demonstrates that a carefully bounded, locality-aware graph traversal delivers recommendation quality comparable to the friends-of-friends heuristic used by industrial platforms while being asymptotically and empirically more efficient than textbook whole-graph methods. Future work includes incorporating weighted edges and time-decay, the Adamic/Adar and supervised link-prediction scores used in production systems, approximate random-walk methods such as those in Twitter's GraphJet and Pinterest's Pixie, and graph-neural-network embeddings (GraphSAGE/PinSage) for personalised, content-aware ranking at web scale."),
];

// =========================================================================
//  TABLE OF CONTENTS
// =========================================================================
const tocPage = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 30, color: NAVY })] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
];

// =========================================================================
//  CHAPTER 1 — INTRODUCTION
// =========================================================================
const chap1 = [
  H1("Chapter 1: Introduction"),
  H2("1.1  Overview of the Problem Statement"),
  P("A social network can be formally represented as a graph G = (V, E), where the set of vertices V denotes the users of the platform and the set of edges E denotes the relationships (friendships or connections) between them. A friendship is symmetric, so the graph is undirected: if user A is a friend of user B then user B is a friend of user A. Modern platforms operate at enormous scale — Facebook's social graph spans well over a billion users and on the order of a trillion edges — yet they must still answer, for any individual user and in real time, the question: 'Who should this person connect with next?'"),
  P("The friend-recommendation problem is therefore a link-prediction problem on a very large, sparse graph: given a source user, identify other users who are not yet connected to them but are highly likely to become connections. The dominant and most explainable signal for this prediction is the number of mutual friends, a direct consequence of triadic closure — the well-documented sociological tendency for two people who share a common friend to themselves become friends. The central computational challenge is that, although the answer is local (it lives one or two hops away from the source), a naive implementation can end up scanning the entire network for every single query, which is prohibitively expensive at scale."),
  H2("1.2  Significance"),
  P("Recommendation engines are the primary growth lever of social platforms; LinkedIn has publicly credited its 'People You May Know' feature with building more than half of the connections on the platform. The quality of recommendations directly affects engagement, retention and network density, while the cost of computing them directly affects infrastructure spend and latency. An algorithm that produces the same high-value friends-of-friends recommendations but at a fraction of the computational cost is therefore of significant practical value. Studying how such an algorithm compares with the techniques used by Facebook, Instagram, LinkedIn, Twitter/X and Pinterest also provides strong pedagogical insight into how textbook graph theory scales to industrial systems."),
  H2("1.3  Objectives"),
  numItem("To model a social network as an undirected graph using an efficient adjacency-list representation supporting O(1) friendship checks."),
  numItem("To design and implement a friend-recommendation algorithm based on a depth-limited (distance-2) Breadth-First Search ranked by mutual-friend count."),
  numItem("To analyse the time and space complexity of the proposed algorithm and to contrast it with adjacency-matrix and full-graph BFS/DFS baselines."),
  numItem("To build an interactive prototype that visualises the network, the recommendation process and a live performance benchmark."),
  numItem("To empirically demonstrate, on networks of up to 10,000 users, that the proposed algorithm is more optimized — by a clear margin — than the baseline approaches, and to position it relative to the algorithms used by leading social-network platforms."),
];

// =========================================================================
//  CHAPTER 2 — SOLUTION DESIGN
// =========================================================================
const chap2 = [
  H1("Chapter 2: Solution Design"),
  H2("2.1  System Architecture"),
  P("The system is organised in three layers. The data-structure layer implements the social graph as a TypeScript class, SocialGraph, that stores an adjacency list as a hash map from a user identifier to a Set of neighbour identifiers, together with a parallel map of user metadata. The algorithm layer exposes the operations on this graph: adding users and friendships, retrieving direct friends, checking friendship and — most importantly — generating ranked recommendations. The presentation layer is a React single-page application that renders the graph, the adjacency matrix, the recommendation list and a dedicated benchmarking and simulation module."),
  P("The adjacency-list representation is chosen deliberately. For the sparse graphs that characterise real social networks (where the average degree is far smaller than the number of users), an adjacency list consumes only O(V + E) space, compared with O(V²) for an adjacency matrix. Using a Set rather than a list for each neighbourhood gives expected O(1) friendship tests and O(1) insertion, which are the primitive operations on which the recommender is built."),
  table([1900, 2600, 2600, 2980], [
    new TableRow({ children: [
      cell("Operation", { w: 1900, head: true }), cell("Adjacency List (Set)", { w: 2600, head: true }),
      cell("Adjacency Matrix", { w: 2600, head: true }), cell("Remarks", { w: 2980, head: true }),
    ] }),
    new TableRow({ children: [cell("Space", { w: 1900, bold: true }), cell("O(V + E)", { w: 2600 }), cell("O(V²)", { w: 2600 }), cell("Matrix wastes memory on sparse graphs", { w: 2980 })] }),
    new TableRow({ children: [cell("Check friendship", { w: 1900, bold: true }), cell("O(1)", { w: 2600 }), cell("O(1)", { w: 2600 }), cell("Both constant", { w: 2980 })] }),
    new TableRow({ children: [cell("Get all friends", { w: 1900, bold: true }), cell("O(k)", { w: 2600 }), cell("O(V)", { w: 2600 }), cell("List touches only real neighbours", { w: 2980 })] }),
    new TableRow({ children: [cell("Add friendship", { w: 1900, bold: true }), cell("O(1)", { w: 2600 }), cell("O(1)", { w: 2600 }), cell("Both constant", { w: 2980 })] }),
  ]),
  spacer(120),
  H2("2.2  Selection and Justification of the Algorithm"),
  P("The friend-recommendation operation is implemented as a depth-limited Breadth-First Search rooted at the source user. Level 0 is the source; level 1 is the set of direct friends; level 2 is the set of friends-of-friends, which constitutes the candidate recommendation set. For each candidate the algorithm counts how many of the source's direct friends connect to it — the mutual-friend count — and finally sorts the candidates in descending order of this count. Direct friends and the source itself are excluded, and a hash Set is used to de-duplicate candidates reachable through several friends."),
  P([
    run("Because the traversal never goes beyond distance two, it visits at most the source's k friends and, for each, that friend's neighbours, giving a running time of ", {}),
    run("O(k²)", { bold: true }),
    run(" per query, where k is the degree of the source. Crucially this is independent of the total number of users V. The ranking step sorts r candidates in O(r log r). This is the same friends-of-friends, mutual-friend-ranked heuristic — an instantiation of triadic closure and of the common-neighbours link-prediction score formalised by Liben-Nowell and Kleinberg — that Facebook's 'People You May Know' and LinkedIn's connection recommender use as their primary candidate-generation signal.", {}),
  ]),
  P("Two textbook baselines were rejected for the per-query path. A full Breadth-First or Depth-First traversal correctly finds all distance-2 nodes but visits every reachable vertex and edge, costing O(V + E) per query — it answers a local question by exploring the whole network. An adjacency-matrix / squared-adjacency (A²) approach tests every user in the network for a shared connection, costing O(V · k) per query and O(V²) space. Both scale with the size of the network rather than the size of the user's neighbourhood, and are therefore asymptotically inferior for this task. The justification for the chosen design is precisely this locality: matching the work done to the locality of the query."),
];

// =========================================================================
//  CHAPTER 3 — IMPLEMENTATION DETAILS
// =========================================================================
const codeStyle = (t) => new Paragraph({
  shading: { fill: "F2F4F8", type: ShadingType.CLEAR }, spacing: { after: 0, line: 252 },
  children: [new TextRun({ text: t, font: "Consolas", size: 18, color: "1A2B45" })],
});
const chap3 = [
  H1("Chapter 3: Implementation Details"),
  H2("3.1  Description of the Implementation Approach"),
  P("The graph and all algorithms are implemented in TypeScript. The SocialGraph class encapsulates two private maps — the adjacency list and the user table — and exposes a small, well-typed public interface. The recommendation routine, shown below in condensed form, performs the distance-2 traversal and mutual-friend accumulation in a single pass before ranking:"),
  codeStyle("getRecommendations(userId) {"),
  codeStyle("  const friends = adjacency.get(userId);"),
  codeStyle("  const mutual = new Map();          // candidate -> mutual count"),
  codeStyle("  for (const f of friends)           // level 1: direct friends"),
  codeStyle("    for (const cand of adjacency.get(f))  // level 2: friends-of-friends"),
  codeStyle("      if (cand !== userId && !friends.has(cand))"),
  codeStyle("        mutual.set(cand, (mutual.get(cand) || 0) + 1);"),
  codeStyle("  return [...mutual].sort((a,b) => b[1] - a[1]);  // rank by mutual count"),
  codeStyle("}"),
  spacer(120),
  P("The benchmarking module re-implements the same four algorithms over a compact, cache-friendly representation (typed Int32Array adjacency lists with parallel Set membership structures) so that the comparison is fair and the JavaScript engine cannot optimise the work away. Each algorithm is timed over hundreds of source queries using performance.now(), with a warm-up pass to let the just-in-time compiler settle."),
  H2("3.2  Coding Best Practices"),
  bullet([run("Modularity: ", { bold: true }), run("graph data structures (graph.ts), the benchmark engine (benchmark.ts) and the animated simulation (simulation.ts) are separated into independent modules with clearly defined interfaces, and the UI is decomposed into reusable React components.")]),
  bullet([run("Readability: ", { bold: true }), run("descriptive identifiers, exhaustive inline documentation of each algorithm's complexity, and strict TypeScript typing make the intent of every routine explicit.")]),
  bullet([run("Maintainability: ", { bold: true }), run("pure, side-effect-free algorithm functions are unit-testable in isolation; the graph generator, the timing harness and the rendering layer can each evolve independently.")]),
  bullet([run("Correctness safeguards: ", { bold: true }), run("the recommender excludes the source and existing friends, de-duplicates candidates through a Set, and the benchmark returns a checksum from every algorithm to prevent dead-code elimination from distorting the timings.")]),
];

// =========================================================================
//  CHAPTER 4 — PROTOTYPE DEVELOPMENT
// =========================================================================
const chap4 = [
  H1("Chapter 4: Prototype Development"),
  H2("4.1  Approach"),
  P("The prototype is an interactive web application built with React 18, TypeScript and Vite, styled with Tailwind CSS and shadcn/ui, and charted with Recharts. It comprises a home view (graph visualisation with live recommendations), an add-user/friend view, an adjacency-matrix view, a 'How It Works' explainer and — the centrepiece of this study — a Benchmark view. The theoretical framework is graph theory and link prediction; the empirical framework is a controlled, in-browser micro-benchmark over synthetic graphs whose topology matches that of real social networks."),
  P("To make the comparison realistic, the benchmark does not use uniform-random graphs. Instead it generates scale-free networks using the Barabási–Albert preferential-attachment model, which reproduces the heavy-tailed degree distribution — a few high-degree 'hubs' and a long tail of low-degree users — that characterises actual social graphs. This stresses every algorithm on a topology where hubs would cause naive whole-graph methods to do the most wasted work."),
  H2("4.2  Procedures"),
  numItem("Graph generation: a Barabási–Albert network of the chosen size (up to 10,000 users, average degree ≈ 8) is constructed; new users attach to existing users with probability proportional to their current degree.", "nums2"),
  numItem("Algorithm registration: four algorithms — the optimized depth-2 BFS (this project), full BFS, full DFS and the adjacency-matrix / brute-force A² baseline — are each given the identical graph and an identical set of sampled source users.", "nums2"),
  numItem("Timing: every algorithm answers a recommendation query from each sampled source; total and per-query wall-clock time are measured with performance.now() after a warm-up pass, and throughput (queries/second) and the speed-up relative to the slowest algorithm are derived.", "nums2"),
  numItem("Scaling sweep: the entire benchmark is repeated for network sizes from 500 to 10,000 users so that the growth of each algorithm's running time can be plotted against V.", "nums2"),
  numItem("Animated simulation: on a smaller force-directed layout the four algorithms are run side-by-side, lighting up each vertex as it is visited, so that the proportion of the network each one explores is directly visible.", "nums2"),
  P("The simulation makes the asymptotic argument tangible: for a typical source user the optimized algorithm illuminates only a small local cluster — about 7% of the vertices — and then stops at distance two, whereas the full BFS, full DFS and matrix approaches illuminate 100% of the network before returning the same recommendations."),
];

// =========================================================================
//  CHAPTER 5 — EXPECTED OUTCOME / RESULTS
// =========================================================================
const chap5 = [
  H1("Chapter 5: Results and Expected Outcome"),
  H2("5.1  Functional Prototype"),
  P("The project delivers a fully functional prototype: an interactive social-graph explorer in which users and friendships can be added, recommendations are produced and explained in real time, the network and its adjacency matrix are visualised, and a benchmarking module quantifies and animates the performance of the recommendation algorithm against three baselines."),
  H2("5.2  Performance Results"),
  P("The table below reports a representative run on a 10,000-user Barabási–Albert network (≈ 40,000 friendships), benchmarked over 400 recommendation queries. Times are per query; throughput is queries per second; speed-up is relative to the slowest baseline. Absolute figures vary with hardware, but the relative ordering and asymptotic shape are invariant."),
  table([2960, 1700, 1700, 1860, 1860], [
    new TableRow({ children: [
      cell("Algorithm", { w: 2960, head: true }), cell("Complexity", { w: 1700, head: true }),
      cell("µs / query", { w: 1700, head: true }), cell("Queries / sec", { w: 1860, head: true }), cell("Speed-up", { w: 1860, head: true }),
    ] }),
    new TableRow({ children: [
      cell([new Paragraph({ children: [new TextRun({ text: "This Project — Depth-2 BFS", bold: true, size: 20 })] })], { w: 2960, shade: LIGHT }),
      cell("O(k²)", { w: 1700, shade: LIGHT, align: AlignmentType.CENTER }), cell("15.25", { w: 1700, shade: LIGHT, align: AlignmentType.CENTER, bold: true }),
      cell("65,574", { w: 1860, shade: LIGHT, align: AlignmentType.CENTER, bold: true }), cell("54.4×", { w: 1860, shade: LIGHT, align: AlignmentType.CENTER, bold: true }),
    ] }),
    new TableRow({ children: [cell("Naive Full BFS", { w: 2960 }), cell("O(V + E)", { w: 1700, align: AlignmentType.CENTER }), cell("274.75", { w: 1700, align: AlignmentType.CENTER }), cell("3,640", { w: 1860, align: AlignmentType.CENTER }), cell("3.0×", { w: 1860, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [cell("DFS Full Component Scan", { w: 2960 }), cell("O(V + E)", { w: 1700, align: AlignmentType.CENTER }), cell("389.25", { w: 1700, align: AlignmentType.CENTER }), cell("2,569", { w: 1860, align: AlignmentType.CENTER }), cell("2.1×", { w: 1860, align: AlignmentType.CENTER })] }),
    new TableRow({ children: [cell("Adjacency-Matrix / Brute-Force A²", { w: 2960 }), cell("O(V · k)", { w: 1700, align: AlignmentType.CENTER }), cell("830.25", { w: 1700, align: AlignmentType.CENTER }), cell("1,204", { w: 1860, align: AlignmentType.CENTER }), cell("1.0×", { w: 1860, align: AlignmentType.CENTER })] }),
  ]),
  spacer(120),
  P([
    run("The optimized algorithm answered queries roughly ", {}),
    run("54× faster", { bold: true }),
    run(" than the adjacency-matrix baseline and several times faster than full BFS/DFS. In the scaling sweep its per-query time stays essentially flat as the network grows from 500 to 10,000 users, while the whole-graph methods climb steadily with V — the empirical signature of the O(k²) versus O(V + E) / O(V · k) distinction.", {}),
  ]),
  H2("5.3  Comparison with Industry-Standard Social-Network Algorithms"),
  P("The table situates this project's algorithm among the recommendation systems of major platforms. The recurring theme is that every successful production system is locality-aware: it generates candidates from the immediate neighbourhood (friends-of-friends, common neighbours, short random walks) rather than scanning the whole graph, and only then applies heavier ranking. This project implements exactly that candidate-generation principle, with an optimal bounded traversal, and deliberately leaves the heavier machine-learned ranking as future work."),
  table([1800, 3200, 2600, 2180], [
    new TableRow({ children: [
      cell("Platform", { w: 1800, head: true }), cell("Recommendation Approach", { w: 3200, head: true }),
      cell("Core Principle", { w: 2600, head: true }), cell("Cost Character", { w: 2180, head: true }),
    ] }),
    new TableRow({ children: [cell("Facebook / Instagram", { w: 1800, bold: true }), cell("'People You May Know' — friends-of-friends ranked by mutual friends, recency and tie strength; supervised random-walk link prediction.", { w: 3200 }), cell("Triadic closure / mutual friends", { w: 2600 }), cell("Local candidate generation + ML ranking", { w: 2180 })] }),
    new TableRow({ children: [cell("LinkedIn", { w: 1800, bold: true }), cell("'People You May Know' — common-neighbour / co-occurrence candidate generation, organisational overlap, large-scale ML ranking.", { w: 3200 }), cell("Common neighbours / co-occurrence", { w: 2600 }), cell("Heuristic candidates, then ranking", { w: 2180 })] }),
    new TableRow({ children: [cell("Twitter / X", { w: 1800, bold: true }), cell("'Who To Follow' and GraphJet — in-memory graph with personalised SALSA / random-walk recommendations.", { w: 3200 }), cell("Random walks (SALSA)", { w: 2600 }), cell("Bounded-length local walks", { w: 2180 })] }),
    new TableRow({ children: [cell("Pinterest", { w: 1800, bold: true }), cell("Pixie — real-time biased random walks over a 3-billion-node object graph; PinSage — graph-convolutional embeddings.", { w: 3200 }), cell("Random walks + GNN embeddings", { w: 2600 }), cell("Local walks + learned embeddings", { w: 2180 })] }),
    new TableRow({ children: [
      cell([new Paragraph({ children: [new TextRun({ text: "This Project", bold: true, size: 20 })] })], { w: 1800, shade: LIGHT }),
      cell("Depth-2 BFS over an adjacency list; friends-of-friends ranked by mutual-friend count.", { w: 3200, shade: LIGHT }),
      cell("Triadic closure / common neighbours", { w: 2600, shade: LIGHT }),
      cell([new Paragraph({ children: [new TextRun({ text: "Optimal local O(k²) traversal", bold: true, size: 20 })] })], { w: 2180, shade: LIGHT }),
    ] }),
  ]),
  spacer(120),
  H2("5.4  Impact and Future Work"),
  bullet("A functional, well-documented prototype that makes graph-algorithm trade-offs visible and measurable — valuable as both a tool and a teaching aid."),
  bullet("A measurable performance improvement: an order-of-magnitude (≈ 54×) speed-up over the brute-force baseline for the recommendation query, with constant per-query cost as the network scales."),
  bullet("Alignment with industrial practice: the same triadic-closure candidate-generation principle used by billion-user platforms, implemented with an asymptotically optimal local traversal."),
  bullet("Future directions: weighted and time-decayed edges, Adamic/Adar and supervised link-prediction scoring, approximate random-walk methods (GraphJet, Pixie) and graph-neural-network embeddings (GraphSAGE, PinSage) for content-aware, personalised ranking at web scale."),
];

// =========================================================================
//  REFERENCES (IEEE)
// =========================================================================
function refItem(children) {
  return new Paragraph({ numbering: { reference: "refs", level: 0 }, spacing: { after: 120, line: 264 },
    alignment: AlignmentType.JUSTIFIED, children });
}
const refsPage = [
  H1("References"),
  refItem([run("L. Backstrom and J. Leskovec, “Supervised random walks: Predicting and recommending links in social networks,” in "), run("Proc. 4th ACM Int. Conf. Web Search and Data Mining (WSDM)", { i: true }), run(", 2011, pp. 635–644.")]),
  refItem([run("N. Bronson et al., “TAO: Facebook’s distributed data store for the social graph,” in "), run("Proc. USENIX Annual Technical Conf. (ATC)", { i: true }), run(", 2013, pp. 49–60.")]),
  refItem([run("Meta, “People You May Know,” Meta Transparency Center. [Online]. Available: "), new ExternalHyperlink({ link: "https://transparency.meta.com/features/explaining-ranking/fb-people-you-may-know/", children: [new TextRun({ text: "https://transparency.meta.com/features/explaining-ranking/fb-people-you-may-know/", style: "Hyperlink", size: 22 })] })]),
  refItem([run("LinkedIn Engineering, “Building a large-scale recommendation system: People You May Know.” [Online]. Available: "), new ExternalHyperlink({ link: "https://www.linkedin.com/blog/engineering/recommendations/building-a-large-scale-recommendation-system-people-you-may-know", children: [new TextRun({ text: "linkedin.com/blog/engineering", style: "Hyperlink", size: 22 })] })]),
  refItem([run("P. Gupta, A. Goel, J. Lin, A. Sharma, D. Wang, and R. Zadeh, “WTF: The who to follow service at Twitter,” in "), run("Proc. 22nd Int. Conf. World Wide Web (WWW)", { i: true }), run(", 2013, pp. 505–514.")]),
  refItem([run("A. Sharma, J. Jiang, P. Bommannavar, B. Larson, and J. Lin, “GraphJet: Real-time content recommendations at Twitter,” "), run("Proc. VLDB Endowment", { i: true }), run(", vol. 9, no. 13, pp. 1281–1292, 2016.")]),
  refItem([run("C. Eksombatchai et al., “Pixie: A system for recommending 3+ billion items to 200+ million users in real-time,” in "), run("Proc. World Wide Web Conf. (WWW)", { i: true }), run(", 2018, pp. 1775–1784.")]),
  refItem([run("R. Ying, R. He, K. Chen, P. Eksombatchai, W. L. Hamilton, and J. Leskovec, “Graph convolutional neural networks for web-scale recommender systems,” in "), run("Proc. 24th ACM SIGKDD Int. Conf. Knowledge Discovery & Data Mining (KDD)", { i: true }), run(", 2018, pp. 974–983.")]),
  refItem([run("W. L. Hamilton, R. Ying, and J. Leskovec, “Inductive representation learning on large graphs,” in "), run("Proc. 31st Int. Conf. Neural Information Processing Systems (NeurIPS)", { i: true }), run(", 2017, pp. 1025–1035.")]),
  refItem([run("D. Liben-Nowell and J. Kleinberg, “The link-prediction problem for social networks,” "), run("J. Amer. Soc. Inf. Sci. Technol.", { i: true }), run(", vol. 58, no. 7, pp. 1019–1031, 2007.")]),
  refItem([run("L. A. Adamic and E. Adar, “Friends and neighbors on the web,” "), run("Social Networks", { i: true }), run(", vol. 25, no. 3, pp. 211–230, 2003.")]),
  refItem([run("M. S. Granovetter, “The strength of weak ties,” "), run("American Journal of Sociology", { i: true }), run(", vol. 78, no. 6, pp. 1360–1380, 1973.")]),
  refItem([run("A.-L. Barabási and R. Albert, “Emergence of scaling in random networks,” "), run("Science", { i: true }), run(", vol. 286, no. 5439, pp. 509–512, 1999.")]),
  refItem([run("T. H. Cormen, C. E. Leiserson, R. L. Rivest, and C. Stein, "), run("Introduction to Algorithms", { i: true }), run(", 4th ed. Cambridge, MA, USA: MIT Press, 2022.")]),
  refItem([run("J. Leskovec and A. Krevl, “SNAP datasets: Stanford large network dataset collection,” Stanford Univ., 2014. [Online]. Available: "), new ExternalHyperlink({ link: "http://snap.stanford.edu/data", children: [new TextRun({ text: "http://snap.stanford.edu/data", style: "Hyperlink", size: 22 })] })]),
  refItem([run("Meta Engineering, “TAO: The power of the graph,” Engineering at Meta, 2013. [Online]. Available: "), new ExternalHyperlink({ link: "https://engineering.fb.com/2013/06/25/core-infra/tao-the-power-of-the-graph/", children: [new TextRun({ text: "engineering.fb.com", style: "Hyperlink", size: 22 })] })]),
];

// =========================================================================
//  ASSEMBLE DOCUMENT
// =========================================================================
const PAGE = { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1080, bottom: 1080, left: 1080 } };
function section(children, opts = {}) {
  return {
    properties: { page: PAGE, ...(opts.props || {}) },
    headers: { default: watermarkHeader() },
    footers: { default: footerBanner() },
    children,
  };
}

const doc = new Document({
  creator: "Shlok; Karthik Anup Revankar",
  title: TITLE,
  description: "DAA Experiential Learning Report",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: NAVY, font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: NAVY2, font: "Calibri" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "nums", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "nums2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "refs", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "[%1]", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 420 } } } }] },
    ],
  },
  sections: [
    section(titlePage),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...certPage], { }),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...declPage]),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...abstractPage]),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...tocPage]),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...chap1,
      new Paragraph({ pageBreakBefore: true, children: [] }), ...chap2,
      new Paragraph({ pageBreakBefore: true, children: [] }), ...chap3,
      new Paragraph({ pageBreakBefore: true, children: [] }), ...chap4,
      new Paragraph({ pageBreakBefore: true, children: [] }), ...chap5]),
    section([new Paragraph({ pageBreakBefore: true, children: [] }), ...refsPage]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "..", "DAA_EL_Report.docx");
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});
