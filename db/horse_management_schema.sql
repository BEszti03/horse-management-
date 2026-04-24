--
-- PostgreSQL database dump
--

\restrict nKQ0Q2RiZMnQuCcQuYxHuDKGQqbSO3BkLpQY7tcOnGZHntuu3hHTAUG40eZS1hP

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-24 21:33:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16399)
-- Name: felhasznalo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.felhasznalo (
    felhasznalo_id integer NOT NULL,
    nev character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    szerepkor character varying(50) DEFAULT 'lovas'::character varying NOT NULL,
    lovarda_id integer,
    jelszo_hash text DEFAULT ''::text NOT NULL,
    profilkep_url text,
    elso_belepes boolean DEFAULT true,
    CONSTRAINT chk_szerepkor CHECK (((szerepkor)::text = ANY ((ARRAY['lovas'::character varying, 'lovarda_vezeto'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.felhasznalo OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16398)
-- Name: felhasznalo_felhasznalo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.felhasznalo_felhasznalo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.felhasznalo_felhasznalo_id_seq OWNER TO postgres;

--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 221
-- Name: felhasznalo_felhasznalo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.felhasznalo_felhasznalo_id_seq OWNED BY public.felhasznalo.felhasznalo_id;


--
-- TOC entry 228 (class 1259 OID 16450)
-- Name: jegyzet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jegyzet (
    jegyzet_id integer NOT NULL,
    cim character varying(150),
    szoveg text NOT NULL,
    mikor_irta timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    felhasznalo_id integer NOT NULL
);


ALTER TABLE public.jegyzet OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16449)
-- Name: jegyzet_jegyzet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jegyzet_jegyzet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jegyzet_jegyzet_id_seq OWNER TO postgres;

--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 227
-- Name: jegyzet_jegyzet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jegyzet_jegyzet_id_seq OWNED BY public.jegyzet.jegyzet_id;


--
-- TOC entry 226 (class 1259 OID 16435)
-- Name: lo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lo (
    lo_id integer NOT NULL,
    nev character varying(100) NOT NULL,
    fajta character varying(100),
    szuletesi_ido date,
    felhasznalo_id integer NOT NULL,
    kep_url text
);


ALTER TABLE public.lo OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16434)
-- Name: lo_lo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lo_lo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lo_lo_id_seq OWNER TO postgres;

--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 225
-- Name: lo_lo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lo_lo_id_seq OWNED BY public.lo.lo_id;


--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: lovarda; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lovarda (
    lovarda_id integer NOT NULL,
    nev character varying(100) NOT NULL
);


ALTER TABLE public.lovarda OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: lovarda_lovarda_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lovarda_lovarda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lovarda_lovarda_id_seq OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 219
-- Name: lovarda_lovarda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lovarda_lovarda_id_seq OWNED BY public.lovarda.lovarda_id;


--
-- TOC entry 224 (class 1259 OID 16418)
-- Name: palya; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.palya (
    palya_id integer NOT NULL,
    lovarda_id integer NOT NULL,
    ferohely integer NOT NULL,
    idopont timestamp without time zone NOT NULL,
    CONSTRAINT palya_ferohely_check CHECK ((ferohely > 0))
);


ALTER TABLE public.palya OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16417)
-- Name: palya_palya_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.palya_palya_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.palya_palya_id_seq OWNER TO postgres;

--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 223
-- Name: palya_palya_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.palya_palya_id_seq OWNED BY public.palya.palya_id;


--
-- TOC entry 233 (class 1259 OID 16498)
-- Name: palya_tartozkodas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.palya_tartozkodas (
    palya_id integer NOT NULL,
    felhasznalo_id integer NOT NULL,
    mettol timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    meddig timestamp without time zone,
    lo_id integer,
    elvegzett boolean DEFAULT false NOT NULL,
    CONSTRAINT palya_tartozkodas_check CHECK (((meddig IS NULL) OR (meddig >= mettol)))
);


ALTER TABLE public.palya_tartozkodas OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16469)
-- Name: teendo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teendo (
    teendo_id integer NOT NULL,
    leiras text NOT NULL,
    statusz character varying(50) DEFAULT 'nyitott'::character varying NOT NULL,
    kezdeti_ido timestamp without time zone,
    hatarido timestamp without time zone,
    felhasznalo_id integer NOT NULL,
    tipus character varying(30) DEFAULT 'egyeb'::character varying NOT NULL,
    lo_id integer,
    elvegzett boolean DEFAULT false NOT NULL,
    CONSTRAINT teendo_check CHECK (((hatarido IS NULL) OR (kezdeti_ido IS NULL) OR (hatarido >= kezdeti_ido)))
);


ALTER TABLE public.teendo OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16468)
-- Name: teendo_teendo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teendo_teendo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teendo_teendo_id_seq OWNER TO postgres;

--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 229
-- Name: teendo_teendo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teendo_teendo_id_seq OWNED BY public.teendo.teendo_id;


--
-- TOC entry 232 (class 1259 OID 16489)
-- Name: verseny; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verseny (
    verseny_id integer NOT NULL,
    nev character varying(150) NOT NULL,
    datum date NOT NULL,
    lovarda_id integer,
    letrehozo_felhasznalo_id integer
);


ALTER TABLE public.verseny OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16518)
-- Name: verseny_felhasznalo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verseny_felhasznalo (
    verseny_id integer NOT NULL,
    felhasznalo_id integer NOT NULL
);


ALTER TABLE public.verseny_felhasznalo OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16535)
-- Name: verseny_lo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verseny_lo (
    verseny_id integer NOT NULL,
    lo_id integer NOT NULL
);


ALTER TABLE public.verseny_lo OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16488)
-- Name: verseny_verseny_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.verseny_verseny_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verseny_verseny_id_seq OWNER TO postgres;

--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 231
-- Name: verseny_verseny_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verseny_verseny_id_seq OWNED BY public.verseny.verseny_id;


--
-- TOC entry 4798 (class 2604 OID 16402)
-- Name: felhasznalo felhasznalo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.felhasznalo ALTER COLUMN felhasznalo_id SET DEFAULT nextval('public.felhasznalo_felhasznalo_id_seq'::regclass);


--
-- TOC entry 4804 (class 2604 OID 16453)
-- Name: jegyzet jegyzet_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jegyzet ALTER COLUMN jegyzet_id SET DEFAULT nextval('public.jegyzet_jegyzet_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16438)
-- Name: lo lo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lo ALTER COLUMN lo_id SET DEFAULT nextval('public.lo_lo_id_seq'::regclass);


--
-- TOC entry 4797 (class 2604 OID 16393)
-- Name: lovarda lovarda_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lovarda ALTER COLUMN lovarda_id SET DEFAULT nextval('public.lovarda_lovarda_id_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 16421)
-- Name: palya palya_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya ALTER COLUMN palya_id SET DEFAULT nextval('public.palya_palya_id_seq'::regclass);


--
-- TOC entry 4806 (class 2604 OID 16472)
-- Name: teendo teendo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teendo ALTER COLUMN teendo_id SET DEFAULT nextval('public.teendo_teendo_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 16492)
-- Name: verseny verseny_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny ALTER COLUMN verseny_id SET DEFAULT nextval('public.verseny_verseny_id_seq'::regclass);


--
-- TOC entry 5014 (class 0 OID 16399)
-- Dependencies: 222
-- Data for Name: felhasznalo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.felhasznalo (felhasznalo_id, nev, email, szerepkor, lovarda_id, jelszo_hash, profilkep_url, elso_belepes) FROM stdin;
11	Nagy Anna	na@gmail.com	lovas	3	$2b$12$wKQdWBajt5dswzIwY6Sx6uedV3avah0XwpGBvDJjwRmJGiJdGaDIu	\N	t
13	Lakatos Dzsézönsztetem	lakatos@gmail.com	lovarda_vezeto	9	$2b$12$Y3xviyReK/sQpkdt0BylYOc0opT44Xq.LGjtwu1GAqia1qBUcKMG6	\N	t
2	Bancsics Eszter	bancsicse@gmail.com	admin	6	$2b$12$AWxC3TQHJNJeTZkC9SwnkeOqunk7lzbV4Zhc38PJtSaWTbZsghiVu	/uploads/users/user-2-1776519034540.jpeg	t
3	Hanna	hanna@gmail.com	lovas	6	$2b$12$8jslT6cxot1kZYTRjMp7gueCnTESNYO154UMFtfFxuMjNOKFpitee	\N	t
6	Enikő	e@gmail.com	lovas	\N	$2b$12$Gu4MSpcoxWcdt.tviwUcs.NcYguMFO4f4UJZ826EFJ187Y8rt6Rwi	\N	t
7	Erik	er@gmail.com	lovas	\N	$2b$12$EuwJBk1AsEDYIwrrcaAe3ewdiXsTd78j.Bs6MBGm5vET/BXA6ijYe	\N	t
1	Anna	anna@gmail.com	lovas	\N	$2b$12$MYtreRC7TSvH5jn6o0hrFOzDBWoAToLLhMUQoa19YCw958SKKEeIO	\N	t
5	Evelin	se@freemail.hu	lovas	\N	$2b$12$.nWIUu.TP8nT.LifeGhG7eHFeZJZ.vAsYh1QzUgqvmBclLTJj3.Am	\N	t
10	Helga	h@gmail.com	lovas	\N	$2b$12$fQj4O9tZg2AKw84ryn4qz.huFQZIT2MzGZOxMm7PY9FK3YejIxUEG	\N	t
15	Nagy Feró	nagyfero@gmail.com	lovarda_vezeto	11	$2b$12$OlykN4fTHwT66EZXHrKfB.a8xq1sjVhRRTOyoGVN2vMZZGJT1nX5a	\N	t
8	Elemér Nagy	ne@gmail.com	lovas	\N	$2b$12$IY.ADwlOPulK9X.R8nK45OfvgYt/oLPT2msMJia5IdVDeYk0H311G	\N	t
14	Antal Ancsa	antala@gmail.com	lovas	4	$2b$12$LoQgmLX6Ps8fd35z/gZ0yOdq6CmlkBKYKM5zIcxmnQkuxtR/vkXqO	\N	t
\.


--
-- TOC entry 5020 (class 0 OID 16450)
-- Dependencies: 228
-- Data for Name: jegyzet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jegyzet (jegyzet_id, cim, szoveg, mikor_irta, felhasznalo_id) FROM stdin;
4	Patakaparó	Ha Szegeden járok lovasboltba nézni új patakaparót\n	2026-01-29 13:59:20.69366	2
\.


--
-- TOC entry 5018 (class 0 OID 16435)
-- Dependencies: 226
-- Data for Name: lo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lo (lo_id, nev, fajta, szuletesi_ido, felhasznalo_id, kep_url) FROM stdin;
5	Herceg	Magyar félvér	2026-01-02	8	\N
8	Hajnal	Holland sportló	2017-08-16	11	\N
9	Mátyás	Magyar félvér	2015-05-13	11	\N
13	Alma	Holland Sportló	2019-05-27	13	\N
14	Rakéta	Arab telivér	2021-07-08	14	\N
4	Mátyás	Magyar félvér	2002-03-04	2	/uploads/horses/horse-4-1776519360290.jpeg
6	Kriszta	Magyar félvér	1998-07-01	2	\N
\.


--
-- TOC entry 5012 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: lovarda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lovarda (lovarda_id, nev) FROM stdin;
3	Napsugár
4	Hold Lovarda
6	Remény Lovasiskola
9	Lakatos
11	Feró Lovasklub
\.


--
-- TOC entry 5016 (class 0 OID 16418)
-- Dependencies: 224
-- Data for Name: palya; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.palya (palya_id, lovarda_id, ferohely, idopont) FROM stdin;
3	3	1	2026-01-27 04:30:00
8	3	1	2026-01-27 01:00:00
11	3	1	2026-01-28 00:25:00
13	6	1	2026-03-20 00:05:00
14	6	1	2026-04-13 16:00:00
15	6	1	2026-04-24 10:00:00
\.


--
-- TOC entry 5025 (class 0 OID 16498)
-- Dependencies: 233
-- Data for Name: palya_tartozkodas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.palya_tartozkodas (palya_id, felhasznalo_id, mettol, meddig, lo_id, elvegzett) FROM stdin;
3	8	2026-01-27 04:30:00	2026-01-27 05:00:00	\N	f
8	2	2026-01-27 01:00:00	2026-01-27 01:25:00	4	f
11	2	2026-01-28 00:25:00	2026-01-28 00:45:00	4	f
13	2	2026-03-20 00:05:00	2026-03-20 01:15:00	4	f
14	2	2026-04-13 16:00:00	2026-04-13 17:00:00	4	f
15	2	2026-04-24 10:00:00	2026-04-24 12:00:00	4	f
\.


--
-- TOC entry 5022 (class 0 OID 16469)
-- Dependencies: 230
-- Data for Name: teendo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teendo (teendo_id, leiras, statusz, kezdeti_ido, hatarido, felhasznalo_id, tipus, lo_id, elvegzett) FROM stdin;
5	Új patkó	tervezett	2026-01-27 01:25:00	2026-01-27 01:40:00	8	patkolas	5	f
6	Röntgen	tervezett	2026-01-27 00:10:00	2026-01-27 00:30:00	2	allatorvos	4	f
10	körmölés	tervezett	2026-01-28 01:10:00	2026-01-28 01:35:00	2	patkolas	6	f
14	llflfu	tervezett	2026-03-20 00:05:00	2026-03-20 01:15:00	13	patkolas	\N	f
15	Bőrözött patkó	tervezett	2026-04-14 10:00:00	2026-04-14 11:00:00	2	patkolas	4	f
13	Röntgen	tervezett	2026-03-21 15:10:00	2026-03-21 15:55:00	2	allatorvos	\N	f
16	Fogreszelés	tervezett	2026-04-24 05:00:00	2026-04-24 09:00:00	2	allatorvos	6	f
17	Repedést jelezi	tervezett	2026-04-24 13:00:00	2026-04-24 16:00:00	2	patkolas	6	f
\.


--
-- TOC entry 5024 (class 0 OID 16489)
-- Dependencies: 232
-- Data for Name: verseny; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verseny (verseny_id, nev, datum, lovarda_id, letrehozo_felhasznalo_id) FROM stdin;
7	Húsvéti kupa	2026-04-02	9	\N
8	Választás kupa	2026-04-12	11	\N
\.


--
-- TOC entry 5026 (class 0 OID 16518)
-- Dependencies: 234
-- Data for Name: verseny_felhasznalo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verseny_felhasznalo (verseny_id, felhasznalo_id) FROM stdin;
7	14
8	14
7	2
8	3
\.


--
-- TOC entry 5027 (class 0 OID 16535)
-- Dependencies: 235
-- Data for Name: verseny_lo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verseny_lo (verseny_id, lo_id) FROM stdin;
7	14
8	14
7	4
\.


--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 221
-- Name: felhasznalo_felhasznalo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.felhasznalo_felhasznalo_id_seq', 15, true);


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 227
-- Name: jegyzet_jegyzet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jegyzet_jegyzet_id_seq', 5, true);


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 225
-- Name: lo_lo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lo_lo_id_seq', 14, true);


--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 219
-- Name: lovarda_lovarda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lovarda_lovarda_id_seq', 11, true);


--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 223
-- Name: palya_palya_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.palya_palya_id_seq', 15, true);


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 229
-- Name: teendo_teendo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teendo_teendo_id_seq', 18, true);


--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 231
-- Name: verseny_verseny_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.verseny_verseny_id_seq', 8, true);


--
-- TOC entry 4820 (class 2606 OID 16411)
-- Name: felhasznalo felhasznalo_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.felhasznalo
    ADD CONSTRAINT felhasznalo_email_key UNIQUE (email);


--
-- TOC entry 4822 (class 2606 OID 16409)
-- Name: felhasznalo felhasznalo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.felhasznalo
    ADD CONSTRAINT felhasznalo_pkey PRIMARY KEY (felhasznalo_id);


--
-- TOC entry 4833 (class 2606 OID 16462)
-- Name: jegyzet jegyzet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jegyzet
    ADD CONSTRAINT jegyzet_pkey PRIMARY KEY (jegyzet_id);


--
-- TOC entry 4830 (class 2606 OID 16443)
-- Name: lo lo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lo
    ADD CONSTRAINT lo_pkey PRIMARY KEY (lo_id);


--
-- TOC entry 4818 (class 2606 OID 16397)
-- Name: lovarda lovarda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lovarda
    ADD CONSTRAINT lovarda_pkey PRIMARY KEY (lovarda_id);


--
-- TOC entry 4827 (class 2606 OID 16428)
-- Name: palya palya_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya
    ADD CONSTRAINT palya_pkey PRIMARY KEY (palya_id);


--
-- TOC entry 4844 (class 2606 OID 16507)
-- Name: palya_tartozkodas palya_tartozkodas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya_tartozkodas
    ADD CONSTRAINT palya_tartozkodas_pkey PRIMARY KEY (palya_id, felhasznalo_id, mettol);


--
-- TOC entry 4837 (class 2606 OID 16482)
-- Name: teendo teendo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teendo
    ADD CONSTRAINT teendo_pkey PRIMARY KEY (teendo_id);


--
-- TOC entry 4846 (class 2606 OID 16524)
-- Name: verseny_felhasznalo verseny_felhasznalo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_felhasznalo
    ADD CONSTRAINT verseny_felhasznalo_pkey PRIMARY KEY (verseny_id, felhasznalo_id);


--
-- TOC entry 4848 (class 2606 OID 16541)
-- Name: verseny_lo verseny_lo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_lo
    ADD CONSTRAINT verseny_lo_pkey PRIMARY KEY (verseny_id, lo_id);


--
-- TOC entry 4840 (class 2606 OID 16497)
-- Name: verseny verseny_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny
    ADD CONSTRAINT verseny_pkey PRIMARY KEY (verseny_id);


--
-- TOC entry 4823 (class 1259 OID 16555)
-- Name: idx_felhasznalo_lovarda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_felhasznalo_lovarda ON public.felhasznalo USING btree (lovarda_id);


--
-- TOC entry 4831 (class 1259 OID 16552)
-- Name: idx_jegyzet_felhasznalo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jegyzet_felhasznalo ON public.jegyzet USING btree (felhasznalo_id);


--
-- TOC entry 4828 (class 1259 OID 16554)
-- Name: idx_lo_felhasznalo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lo_felhasznalo ON public.lo USING btree (felhasznalo_id);


--
-- TOC entry 4825 (class 1259 OID 16556)
-- Name: idx_palya_lovarda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_palya_lovarda ON public.palya USING btree (lovarda_id);


--
-- TOC entry 4841 (class 1259 OID 16557)
-- Name: idx_tartozkodas_felhasznalo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tartozkodas_felhasznalo ON public.palya_tartozkodas USING btree (felhasznalo_id);


--
-- TOC entry 4842 (class 1259 OID 16617)
-- Name: idx_tartozkodas_felhasznalo_elvegzett; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tartozkodas_felhasznalo_elvegzett ON public.palya_tartozkodas USING btree (felhasznalo_id, elvegzett);


--
-- TOC entry 4834 (class 1259 OID 16553)
-- Name: idx_teendo_felhasznalo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teendo_felhasznalo ON public.teendo USING btree (felhasznalo_id);


--
-- TOC entry 4835 (class 1259 OID 16614)
-- Name: idx_teendo_felhasznalo_elvegzett; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teendo_felhasznalo_elvegzett ON public.teendo USING btree (felhasznalo_id, elvegzett);


--
-- TOC entry 4838 (class 1259 OID 16558)
-- Name: idx_verseny_datum; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verseny_datum ON public.verseny USING btree (datum);


--
-- TOC entry 4824 (class 1259 OID 16565)
-- Name: ux_felhasznalo_email_lower; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_felhasznalo_email_lower ON public.felhasznalo USING btree (lower((email)::text));


--
-- TOC entry 4849 (class 2606 OID 16605)
-- Name: felhasznalo felhasznalo_lovarda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.felhasznalo
    ADD CONSTRAINT felhasznalo_lovarda_id_fkey FOREIGN KEY (lovarda_id) REFERENCES public.lovarda(lovarda_id) ON DELETE SET NULL;


--
-- TOC entry 4852 (class 2606 OID 16463)
-- Name: jegyzet jegyzet_felhasznalo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jegyzet
    ADD CONSTRAINT jegyzet_felhasznalo_id_fkey FOREIGN KEY (felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE CASCADE;


--
-- TOC entry 4851 (class 2606 OID 16444)
-- Name: lo lo_felhasznalo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lo
    ADD CONSTRAINT lo_felhasznalo_id_fkey FOREIGN KEY (felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE CASCADE;


--
-- TOC entry 4850 (class 2606 OID 16429)
-- Name: palya palya_lovarda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya
    ADD CONSTRAINT palya_lovarda_id_fkey FOREIGN KEY (lovarda_id) REFERENCES public.lovarda(lovarda_id) ON DELETE CASCADE;


--
-- TOC entry 4857 (class 2606 OID 16513)
-- Name: palya_tartozkodas palya_tartozkodas_felhasznalo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya_tartozkodas
    ADD CONSTRAINT palya_tartozkodas_felhasznalo_id_fkey FOREIGN KEY (felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE CASCADE;


--
-- TOC entry 4858 (class 2606 OID 16575)
-- Name: palya_tartozkodas palya_tartozkodas_lo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya_tartozkodas
    ADD CONSTRAINT palya_tartozkodas_lo_id_fkey FOREIGN KEY (lo_id) REFERENCES public.lo(lo_id) ON DELETE SET NULL;


--
-- TOC entry 4859 (class 2606 OID 16508)
-- Name: palya_tartozkodas palya_tartozkodas_palya_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palya_tartozkodas
    ADD CONSTRAINT palya_tartozkodas_palya_id_fkey FOREIGN KEY (palya_id) REFERENCES public.palya(palya_id) ON DELETE CASCADE;


--
-- TOC entry 4853 (class 2606 OID 16483)
-- Name: teendo teendo_felhasznalo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teendo
    ADD CONSTRAINT teendo_felhasznalo_id_fkey FOREIGN KEY (felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE CASCADE;


--
-- TOC entry 4854 (class 2606 OID 16570)
-- Name: teendo teendo_lo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teendo
    ADD CONSTRAINT teendo_lo_id_fkey FOREIGN KEY (lo_id) REFERENCES public.lo(lo_id) ON DELETE SET NULL;


--
-- TOC entry 4860 (class 2606 OID 16530)
-- Name: verseny_felhasznalo verseny_felhasznalo_felhasznalo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_felhasznalo
    ADD CONSTRAINT verseny_felhasznalo_felhasznalo_id_fkey FOREIGN KEY (felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE CASCADE;


--
-- TOC entry 4861 (class 2606 OID 16525)
-- Name: verseny_felhasznalo verseny_felhasznalo_verseny_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_felhasznalo
    ADD CONSTRAINT verseny_felhasznalo_verseny_id_fkey FOREIGN KEY (verseny_id) REFERENCES public.verseny(verseny_id) ON DELETE CASCADE;


--
-- TOC entry 4855 (class 2606 OID 16600)
-- Name: verseny verseny_letrehozo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny
    ADD CONSTRAINT verseny_letrehozo_fk FOREIGN KEY (letrehozo_felhasznalo_id) REFERENCES public.felhasznalo(felhasznalo_id) ON DELETE SET NULL;


--
-- TOC entry 4862 (class 2606 OID 16547)
-- Name: verseny_lo verseny_lo_lo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_lo
    ADD CONSTRAINT verseny_lo_lo_id_fkey FOREIGN KEY (lo_id) REFERENCES public.lo(lo_id) ON DELETE CASCADE;


--
-- TOC entry 4863 (class 2606 OID 16542)
-- Name: verseny_lo verseny_lo_verseny_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny_lo
    ADD CONSTRAINT verseny_lo_verseny_id_fkey FOREIGN KEY (verseny_id) REFERENCES public.verseny(verseny_id) ON DELETE CASCADE;


--
-- TOC entry 4856 (class 2606 OID 16582)
-- Name: verseny verseny_lovarda_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verseny
    ADD CONSTRAINT verseny_lovarda_fk FOREIGN KEY (lovarda_id) REFERENCES public.lovarda(lovarda_id) ON DELETE CASCADE;


-- Completed on 2026-04-24 21:33:43

--
-- PostgreSQL database dump complete
--

\unrestrict nKQ0Q2RiZMnQuCcQuYxHuDKGQqbSO3BkLpQY7tcOnGZHntuu3hHTAUG40eZS1hP

