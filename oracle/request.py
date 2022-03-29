import geopandas as gpd
import pandas as pd
import numpy as np
import joblib
from flask import Flask, request
from flask_ngrok import run_with_ngrok

# create the Flask app
app = Flask(__name__)
run_with_ngrok(app)


def estimate(superficie_abitabile, locali, piano, piani_della_casa, new_building, tipo, lng, lat):
    # set shapefile characteristics
    df_shp = gpd.read_file('SHP_GEO_POSTE_PL/GEO_POSTE_PL.shp')
    df_shp.to_crs({'init': 'EPSG:4326'}, inplace=True)

    point = pd.DataFrame({'point': ['example'],
                          'lng': [lng],
                          'lat': [lat]})

    gdf = gpd.GeoDataFrame(point, geometry=gpd.points_from_xy(point.lng, point.lat))
    gdf.crs = 'EPSG:4326'

    assert len(gdf.sjoin(df_shp, how="left", predicate='within')['NO_POSTAL'].values == 1)

    position = str(gdf.sjoin(df_shp, how="left", predicate='within')['NO_POSTAL'].values[0])
    print("Located Post Code is ", position)

    # load column names and set testing values
    columns = np.load('columns.npy', allow_pickle=True)

    set1 = [superficie_abitabile, locali, piano, piani_della_casa, new_building]
    set2 = [1 if tipo in col else 0 for col in list(filter(lambda x: 'Tipo' in x, columns))]
    set3 = [1 if position in col else 0 for col in list(filter(lambda x: 'Position' in x, columns))]

    values = set1 + set2 + set3
    loaded_model = joblib.load('first_model.sav')
    predicted_price = str(int(round(np.exp(loaded_model.predict(np.array(values).reshape(1, -1)))[0], 0))) + " CHF"
    return predicted_price


@app.route('/ginevra-listing-estimated')
def query_example():
    superficie_abitabile = request.args.get('square_footage')
    locali = request.args.get('rooms')
    piano = request.args.get('floor')
    piani_della_casa = request.args.get('building_floors')
    new_building = request.args.get('new_building')
    tipo = request.args.get('class')
    lng = request.args.get('lng')
    lat = request.args.get('lat')
    return estimate(superficie_abitabile, locali, piano, piani_della_casa, new_building, tipo, lng, lat)


if __name__ == '__main__':
    # run app in debug mode on port 5000
    app.run()
