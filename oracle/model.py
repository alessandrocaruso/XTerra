import pandas as pd
from collections import defaultdict
from sklearn.experimental import enable_iterative_imputer
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import train_test_split
from sklearn.impute import IterativeImputer
import ast
import joblib
import re

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

df.drop([' Disponibilità ', ' Codice immobile ', ' Numero oggetto ', 'description', 'details', 'title', 'url',
         ' Superficie terreno '], axis=1,
        inplace=True)

# check for decimal number and anomalies
df = df[~df['price'].str.contains('hiesta')]
print(set(df['price'].str[-7:].to_list()))
print(set(df[' Superficie abitabile '].str[-2:].to_list()))


# parse different columns
df['price'] = df['price'].apply(lambda x: int(re.sub("[^0-9]", "", x)))
df[' Superficie abitabile '] = pd.to_numeric(df[' Superficie abitabile '].str[:-2])
df[' Locali '] = pd.to_numeric(df[' Locali '])

# Fill null values Square Footage using Iterative Imputer on Price
imp = IterativeImputer(max_iter=10, random_state=0)
transformed = imp.fit_transform(df[[' Superficie abitabile ', 'price']])
df[' Superficie abitabile '] = transformed[:, 0]
df['price'] = transformed[:, 1]

# more parsing
df.loc[df[' Piano '].str.contains(' Interrato '), ' Piano '] = ' -1'
df.loc[df[' Piano '].str.contains(' Piano terra '), ' Piano '] = ' 0'
df.loc[df[' Piano '].str.contains(' Più alto di 8° piano'), ' Piano '] = ' 9'

df[' Piano '] = df[' Piano '].apply(lambda x: pd.to_numeric(x[1:3].replace('°', '')))

imp = IterativeImputer(max_iter=10, random_state=0)
transformed = imp.fit_transform(df[[' Piano ', 'price']])
df[' Piano '] = transformed[:, 0]

df[' Piani della casa '] = pd.to_numeric(df[' Piani della casa '].str.strip())
df[' Anno di costruzione '] = pd.to_numeric(df[' Anno di costruzione '].str.strip())

# print(df.groupby([' Ultima ristrutturazione ']).size())

df[' Piani della casa '].fillna(df[' Piani della casa '].median(), inplace=True)

# Feature Engineering
df['New building'] = 0
df.loc[(df[' Anno di costruzione '] > 2000) | (df[' Condizioni '] == ' Nuova costruzione '), 'New building'] = 1

df['Position'] = (df['cap'] + df['city']).apply(lambda x: re.findall(r'\b\d{4}\b', x)[0] if x != [] else [])
df.drop([' Anno di costruzione ', ' Condizioni ', ' Cubatura ', 'cap', 'city', ' Ultima ristrutturazione '], axis=1, inplace=True)

df = pd.get_dummies(df, columns=[' Tipo di oggetto ', 'Position'])

print(df.columns)

print(df.isnull().sum().sum())

X = df.drop('price', axis=1)
y = np.log(df['price'])

# Train Test Split and Cross Validation
X_train, X_test, y_train, y_test = train_test_split(X, y, shuffle=True)

gs = GridSearchCV(estimator=RandomForestRegressor(n_estimators=500, random_state=0),
                  param_grid={'min_samples_leaf': [0.1, 0.3, 0.5],
                              'max_features': [0.1, 0.3, 0.5, 0.7, "sqrt", "log2", "auto"]},
                  cv=4,
                  n_jobs=-1,
                  scoring='neg_mean_squared_error')
gs.fit(X_train, y_train)

results = pd.DataFrame({'max_features': gs.cv_results_['param_max_features'],
                        'min_samples_leaf': gs.cv_results_['param_min_samples_leaf'],
                        'score': gs.cv_results_['mean_test_score']})

print(results[results['score'] == results['score'].max()])

max_features, min_samples_leaf, _ = tuple(results[results['score'] == results['score'].max()].T.values)

# Model Formulation and results
model = RandomForestRegressor(n_estimators=500,
                              min_samples_leaf=min_samples_leaf,
                              max_features=max_features,
                              random_state=0)
model.fit(X, y)

print(pd.DataFrame(
    {'Feature': X.columns,
     'Importance': model.feature_importances_}
))

# save the columns
np.save('columns.npy', X.columns.values, allow_pickle=True)

# save the model
filename = 'first_model.sav'
joblib.dump(model, filename)









