import geopandas as gpd
import pandas as pd
import re
from collections import defaultdict
import ast
import matplotlib.pyplot as plt
import contextily as cx


df = pd.read_csv('../listingscraper/listings_4.csv')

# resolve dictionary from scraping
dd = defaultdict(list)

all_keys = list(
    set([item for x in list(map(lambda x: list(ast.literal_eval(x).keys()), df['details'].to_list())) for item in x]))

for d in list(map(lambda x: ast.literal_eval(x), df['details'].to_list())):
    keys_found = []
    for key, value in d.items():
        keys_found.append(key)
        dd[key].append(value)
    for k in list(set(all_keys) - set(keys_found)):
        dd[k].append("")

df = pd.concat([pd.DataFrame(dd), df], axis=1)

df['Position'] = (df['cap'] + df['city']).apply(lambda x: re.findall(r'\b\d{4}\b', x)[0] if x != [] else [])

df_shp = gpd.read_file('SHP_GEO_POSTE_PL/GEO_POSTE_PL.shp')

df_shp.to_crs({'init': 'EPSG:4326'}, inplace=True)

# check for decimal number and anomalies
df = df[~df['price'].str.contains('hiesta')]


# parse interesting columns
df['price'] = df['price'].apply(lambda x: int(re.sub("[^0-9]", "", x)))
df[' Superficie abitabile '] = pd.to_numeric(df[' Superficie abitabile '].str[:-2])

# only for the sake of visualization and not to lose information
df[' Superficie abitabile '].fillna(df[' Superficie abitabile '].median(), inplace=True)
df['price'].fillna(df['price'].median(), inplace=True)

df['price/sqm'] = df['price'] / df[' Superficie abitabile ']

df = df[['price/sqm', 'Position']].groupby('Position')['price/sqm'].mean()

print(df.head())

df_shp['NO_POSTAL'] = df_shp['NO_POSTAL'].astype(str)

df = pd.merge(df, df_shp[['geometry', 'NO_POSTAL']], left_on='Position', right_on='NO_POSTAL').drop('NO_POSTAL', axis=1)

df = gpd.GeoDataFrame(df, geometry='geometry')

df.to_crs({'init': 'EPSG:3857'}, inplace=True)

ax = df.plot(column='price/sqm', cmap = 'OrRd')

cx.add_basemap(ax)
plt.show()


