# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience: people evaluating the author's work (recruiters, hiring managers, technical
reviewers) who open the site as a portfolio piece, usually for a few minutes, often without
prior context about AENA or the data. A secondary audience is technical reviewers who dig into
the details (metrics definitions, API, code) after the first impression.

## Product Purpose

A public-facing explorer of the departures history of Spain's 11 busiest airports, built on top
of the author's own ETL pipeline (AENA-data-pipeline). It exists to demonstrate end-to-end craft:
data engineering (incremental extraction every 10 minutes, Parquet history), a typed API, and a
polished analytical front end. Success means it reads as a high-quality, real product at first
glance and holds up when someone explores in depth.

## Positioning

It is built on a dataset nobody else has: the author's pipeline records every change of every
departure on AENA's boards (status, gate, estimated time, counters) every 10 minutes, so it can
show how delays evolved flight by flight, not just final outcomes. The live board and per-flight
history are only possible because of that pipeline.

## Operating Context

- Runs locally today (FastAPI backend + Vite/React front end); deployment is a later phase.
- Data refreshes every ~10 minutes in GitHub; locally a scheduled `git pull` keeps it current.
- Pages: Panorama (overview), Aeropuerto (per-airport detail), Rutas (world routes map),
  En directo (departures board + flight history).
- Filters (period, airports, metric, granularity) live in the URL and are shareable.

## Capabilities and Constraints

- Data covers departures only (no arrivals, no passengers) from 15 Sep 2026 onward.
- "Delay" is the estimated delay published on the board, not the actual take-off time; this
  must stay explicit in the UI.
- Codeshares are grouped into physical departures; the operating carrier is unknown.
- The live board is the last pipeline snapshot, not real time; the UI must say so.
- Interface language: Spanish. Light and dark themes are both first-class.
- Basemaps come from CARTO (attribution required); destination coordinates from OurAirports.

## Brand Commitments

- Name in use: "Vuelos de salida · AENA". AENA is the data source, not the author: the site must
  not imitate AENA's branding or suggest it is an official AENA product.

## Evidence on Hand

- Real data: ~2M change events, ~200k flights, 383 destinations in 97 countries (Sep–Oct 2026).
- Photography: none yet. Aircraft photos must be freely licensed (Wikimedia Commons, public
  domain or CC), stored in the repo with author, source and license credited on the site.
- No testimonials, users, press or metrics about the product itself; do not invent any.

## Product Principles

1. Truth first: every number is traceable to a stated definition; limitations are shown, not hidden.
2. First impression matters, depth must survive it: polish the entry, keep detail one click away.
3. The pipeline is the story: what makes this project distinct is the change-by-change history.
4. Shareable and explainable: every view can be linked, and every chart has a table view.

## Accessibility & Inclusion

Charts never rely on colour alone (legends, labels, table views); motion respects
prefers-reduced-motion; both themes must keep text contrast.
